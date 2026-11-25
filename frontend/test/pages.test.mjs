import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);

const PAGES = [
  { file: 'login.html', nav: 'login', heading: 'Iniciar sesión' },
  { file: 'channels.html', nav: 'channels', heading: 'Canales' },
  { file: 'favorites.html', nav: 'favorites', heading: 'Favoritos' },
  { file: 'history.html', nav: 'history', heading: 'Historial' },
];

const LINKS = ['./login.html', './channels.html', './favorites.html', './history.html'];

const readPage = (file) => readFile(new URL(file, ROOT), 'utf8');

test('las 4 páginas existen, están en español y declaran su título', async () => {
  for (const page of PAGES) {
    const html = await readPage(page.file);
    assert.match(html, /<html lang="es">/, `${page.file} debe declarar lang="es"`);
    assert.match(
      html,
      new RegExp(`<h1[^>]*>\\s*${page.heading}`),
      `${page.file} debe tener un <h1> «${page.heading}»`,
    );
    assert.match(html, /<meta name="viewport"/, `${page.file} debe ser responsive`);
  }
});

test('cada página enlaza a las otras tres (navegación completa)', async () => {
  for (const page of PAGES) {
    const html = await readPage(page.file);
    for (const link of LINKS) {
      assert.ok(html.includes(`href="${link}"`), `${page.file} debe enlazar ${link}`);
    }
  }
});

test('cada página marca su enlace activo con data-nav y el mismo data-nav existe en todas', async () => {
  for (const page of PAGES) {
    const html = await readPage(page.file);
    assert.ok(html.includes(`data-nav="${page.nav}"`), `${page.file} debe marcar data-nav="${page.nav}"`);
    for (const other of PAGES) {
      assert.ok(html.includes(`data-nav="${other.nav}"`), `${page.file} debe incluir el enlace ${other.nav}`);
    }
  }
});

test('todas las páginas cargan config.js, styles.css y el indicador de /health', async () => {
  for (const page of PAGES) {
    const html = await readPage(page.file);
    assert.match(html, /<script src="\.\/config\.js"><\/script>/, `${page.file} debe cargar ./config.js`);
    assert.match(html, /<link rel="stylesheet" href="\.\/css\/styles\.css"/, `${page.file} debe cargar styles.css`);
    assert.match(html, /id="api-status"/, `${page.file} debe tener el indicador #api-status`);
    assert.match(html, /<script type="module" src="\.\/js\/[a-z]+\.js"><\/script>/, `${page.file} debe cargar su módulo JS`);
  }
});

test('canales.html integra Shaka Player por CDN junto al <video>', async () => {
  const html = await readPage('channels.html');
  assert.match(html, /shaka-player[^"]*\.js/, 'debe incluir shaka-player.compiled.js');
  assert.match(html, /ajax\.googleapis\.com\/ajax\/libs\/shaka-player\//, 'Shaka debe venir de la CDN fija');
  assert.match(html, /<video id="player-video"/, 'debe existir el elemento <video>');
  assert.match(html, /src="\.\/js\/channels\.js"/, 'debe cargar el módulo de canales');
});

test('las páginas no afirman login real ni favoritos reales', async () => {
  const login = await readPage('login.html');
  const favorites = await readPage('favorites.html');
  const history = await readPage('history.html');

  assert.match(login, /No hay autenticación real/i);
  assert.match(favorites, /todavía no se guardan|no se guardan|no se simula una persistencia/i);
  assert.match(history, /no se registra todavía|no representan actividad real/i);
});

test('no hay credenciales, tokens ni URLs de tv.hub en el scaffold', async () => {
  const files = [...PAGES.map((p) => p.file), 'index.html', 'stubs/channels.json'];
  for (const file of files) {
    const content = await readPage(file);
    assert.ok(!/token\s*=/i.test(content), `${file} no debe contener token=`);
    assert.ok(!/eyJ[A-Za-z0-9_-]{10,}/.test(content), `${file} no debe contener JWT`);
    assert.ok(!/tv\.hub/i.test(content), `${file} no debe referenciar tv.hub`);
  }
});
