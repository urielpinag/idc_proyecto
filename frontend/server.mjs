#!/usr/bin/env node
/**
 * Servidor estático ligero de TV Hub (sin dependencias ni build).
 *
 * Sirve los assets de `frontend/` y expone:
 *   GET /config.js  →  window.TVHUB_CONFIG = { apiBaseUrl, ... }
 *
 * La URL del backend se toma de la variable de entorno `API_BASE_URL`
 * (por defecto `http://localhost:3000`, el puerto acordado para `/backend`).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_PORT = Number(process.env.PORT || 8080);
const DEFAULT_HOST = process.env.HOST || '127.0.0.1';

/** Normaliza `API_BASE_URL` (sin barra final). Vacío ⇒ se devuelve cadena vacía. */
export function normalizeApiBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

export const DEFAULTS = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.API_BASE_URL || 'http://localhost:3000'),
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.md': 'text/markdown; charset=utf-8',
  '.ts': 'video/mp2t',
};

/** Devuelve el script de configuración para inyectar `API_BASE_URL` en el navegador. */
export function renderConfigScript(apiBaseUrl) {
  const config = JSON.stringify({ apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl) }).replace(/</g, '\\u003c');
  return `window.TVHUB_CONFIG = ${config};\n`;
}

/** Rutas admitidas por la "SPA-ish" navegación: `/login` → `/login.html`. */
const ROUTES = new Set(['/login', '/channels', '/favorites', '/history']);

/** Resuelve una ruta URL a un path de fichero dentro de ROOT, o `null` si escapa del directorio. */
export function resolvePath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent((urlPath || '/').split('?')[0]);
  } catch (error) {
    if (error instanceof URIError) return null; // URI malformada (`/%E0%A4%A`): se trata como ruta no válida.
    throw error;
  }
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  else if (ROUTES.has(pathname.replace(/\/$/, ''))) pathname = `${pathname.replace(/\/$/, '')}.html`;

  const target = normalize(join(ROOT, pathname));
  const base = ROOT.replace(/[\\/]$/, '');
  if (target !== base && !target.startsWith(`${base}${sep}`)) {
    return null;
  }
  return target;
}

export function createStaticServer({ apiBaseUrl = DEFAULTS.apiBaseUrl } = {}) {
  return createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
      res.end('Method Not Allowed');
      return;
    }

    const pathname = (req.url || '/').split('?')[0];

    if (pathname === '/config.js') {
      res.writeHead(200, {
        'Content-Type': MIME['.js'],
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : renderConfigScript(apiBaseUrl));
      return;
    }

    if (pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : 'ok');
      return;
    }

    const file = resolvePath(pathname);
    if (!file) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not a file');
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><p>404 — No encontrado.</p>');
    }
  });
}

/** Arranca el servidor (solo si se ejecuta como CLI). */
export function startServer({ port = DEFAULT_PORT, host = DEFAULT_HOST, apiBaseUrl } = {}) {
  const server = createStaticServer({ apiBaseUrl });
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const address = server.address();
      const shown = typeof address === 'object' && address ? address.port : port;
      resolve({ server, port: shown, host, apiBaseUrl: apiBaseUrl ?? DEFAULTS.apiBaseUrl });
    });
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (isMain) {
  const { port, host, apiBaseUrl } = await startServer();
  console.log(`TV Hub frontend: http://${host}:${port}`);
  console.log(`API_BASE_URL   : ${apiBaseUrl || '(no configurada)'}`);
}
