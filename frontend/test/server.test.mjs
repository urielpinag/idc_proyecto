import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { request } from 'node:http';

import { createStaticServer, renderConfigScript, resolvePath, startServer } from '../server.mjs';

/** GET simple contra un servidor local; devuelve status, headers y body en texto. */
function get(port, path) {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function withServer(options, fn) {
  const { server, port } = await startServer({ port: 0, host: '127.0.0.1', ...options });
  try {
    return await fn(port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('renderConfigScript inyecta la API_BASE_URL sin cerrar el <script>', () => {
  const script = renderConfigScript('http://localhost:3000/');
  assert.match(script, /^window\.TVHUB_CONFIG = \{"apiBaseUrl":"http:\/\/localhost:3000"\};/);

  const escaped = renderConfigScript('http://x.test/"><script>alert(1)</script>');
  assert.ok(!escaped.includes('</script>'), 'debe escapar "</script>"');
  assert.ok(!escaped.includes('<script>'), 'debe escapar "<"');
});

test('/config.js sirve la config desde la variable API_BASE_URL', async () => {
  await withServer({ apiBaseUrl: 'http://backend.test:3000' }, async (port) => {
    const res = await get(port, '/config.js');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /javascript/);
    assert.match(res.body, /"apiBaseUrl":"http:\/\/backend\.test:3000"/);
  });
});

test('sirve index.html en / con el MIME correcto', async () => {
  await withServer({}, async (port) => {
    const res = await get(port, '/');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body, /<title>TV Hub/);
  });
});

test('sirve las 4 páginas por su ruta limpia y por su nombre de fichero', async () => {
  await withServer({}, async (port) => {
    for (const page of ['login', 'channels', 'favorites', 'history']) {
      for (const path of [`/${page}`, `/${page}.html`]) {
        const res = await get(port, path);
        assert.equal(res.status, 200, `${path} debería servirse`);
        assert.match(res.body, /lang="es"/);
      }
    }
  });
});

test('sirve los assets JS/CSS del scaffold y el stub de canales', async () => {
  await withServer({}, async (port) => {
    const assets = [
      ['/css/styles.css', /text\/css/],
      ['/js/api.js', /javascript/],
      ['/js/player.js', /javascript/],
      ['/js/channels.js', /javascript/],
      ['/stubs/channels.json', /application\/json/],
      ['/stubs/README.md', /text\/markdown/],
    ];
    for (const [path, mime] of assets) {
      const res = await get(port, path);
      assert.equal(res.status, 200, `${path} debería servirse`);
      assert.match(res.headers['content-type'], mime, `${path} con MIME correcto`);
    }

    const stub = await get(port, '/stubs/channels.json');
    assert.ok(JSON.parse(stub.body).channels.length >= 3, 'el stub servido es JSON válido');
  });
});

test('devuelve 404 para rutas inexistentes y 405 para métodos no permitidos', async () => {
  await withServer({}, async (port) => {
    const missing = await get(port, '/no-existe.html');
    assert.equal(missing.status, 404);

    const post = await new Promise((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, path: '/', method: 'POST' }, (res) => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(post, 405);
  });
});

test('/healthz del propio servidor estático responde ok (liveness del contenedor web)', async () => {
  await withServer({}, async (port) => {
    const res = await get(port, '/healthz');
    assert.equal(res.status, 200);
    assert.equal(res.body, 'ok');
  });
});

test('una URI malformada no mata el proceso: responde 403 y el servidor sigue vivo', async () => {
  await withServer({}, async (port) => {
    // `/%E0%A4%A` es un escape UTF-8 inválido: `decodeURIComponent` lanza URIError.
    const malformed = await get(port, '/%E0%A4%A');
    assert.equal(malformed.status, 403, 'la URI malformada se trata como ruta no permitida');

    // El servidor debe seguir respondiendo después del error.
    const health = await get(port, '/healthz');
    assert.equal(health.status, 200);
    assert.equal(health.body, 'ok');

    const page = await get(port, '/channels');
    assert.equal(page.status, 200);
    assert.match(page.body, /lang="es"/);
  });
});

test('resolvePath devuelve null (no lanza) con una URI malformada', () => {
  assert.equal(resolvePath('/%E0%A4%A'), null);
  assert.match(resolvePath('/channels'), /channels\.html$/);
});

test('resolvePath no permite escapar del directorio raíz', () => {
  assert.equal(resolvePath('/../../etc/passwd'), null);
  assert.match(resolvePath('/channels'), /channels\.html$/);
  assert.ok(createStaticServer instanceof Function);
});
