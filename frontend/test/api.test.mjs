import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkHealth,
  filterChannels,
  collectFilterOptions,
  isSafeHlsUrl,
  isStubUrl,
  loadChannels,
  normalizeChannel,
  requestJson,
} from '../js/api.js';
import { apiUrl, getApiBaseUrl, normalizeBaseUrl } from '../js/config.js';

const BASE = 'http://localhost:3000';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const STUB_BODY = {
  channels: [
    { id: 'stub-1', name: 'Canal Stub', streamUrl: 'https://example.test/a.m3u8', country: 'MX', categories: ['General'] },
  ],
};

test('config: API_BASE_URL se normaliza y se cae a localhost:3000', () => {
  assert.equal(normalizeBaseUrl('http://api.test:8080///'), 'http://api.test:8080');
  assert.equal(normalizeBaseUrl(''), '');
  assert.equal(getApiBaseUrl({ apiBaseUrl: 'http://api.test:8080/' }), 'http://api.test:8080');
  assert.equal(getApiBaseUrl({}), 'http://localhost:3000');
  assert.equal(getApiBaseUrl({ apiBaseUrl: '   ' }), 'http://localhost:3000');
  assert.equal(apiUrl('/health', BASE), 'http://localhost:3000/health');
  assert.equal(apiUrl('/api/channels', undefined), `${BASE}/api/channels`);
});

test('/health: responde ok cuando el backend está sano', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return jsonResponse({ status: 'ok' });
  };

  const health = await checkHealth({ baseUrl: BASE, fetchImpl });
  assert.equal(health.ok, true);
  assert.equal(health.status, 'ok');
  assert.deepEqual(calls, [`${BASE}/health`]);
});

test('/health: un backend caído se reporta como down, no como ok', async () => {
  const fetchImpl = async () => {
    throw new TypeError('fetch failed');
  };

  const health = await checkHealth({ baseUrl: BASE, fetchImpl });
  assert.equal(health.ok, false);
  assert.equal(health.status, 'down');
  assert.match(health.message, /no disponible|stub/i);
});

test('/health: HTTP 503 se reporta como down', async () => {
  const health = await checkHealth({ baseUrl: BASE, fetchImpl: async () => jsonResponse({ status: 'ok' }, 503) });
  assert.equal(health.status, 'down');
});

test('/health: estado inesperado del payload se reporta como degraded', async () => {
  const health = await checkHealth({ baseUrl: BASE, fetchImpl: async () => jsonResponse({ status: 'maintenance' }) });
  assert.equal(health.ok, false);
  assert.equal(health.status, 'degraded');
});

test('requestJson: respeta el timeout con AbortController', async () => {
  const fetchImpl = (url, options) =>
    new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });

  const result = await requestJson(`${BASE}/health`, { fetchImpl, timeoutMs: 10 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'timeout');
});

test('loadChannels: usa la API cuando responde con canales', async () => {
  const fetchImpl = async (url) => {
    if (url === `${BASE}/api/channels`) {
      return jsonResponse({ channels: [{ _id: 'db-1', name: 'Real', streamUrl: 'https://x.test/r.m3u8' }] });
    }
    throw new Error(`URL inesperada: ${url}`);
  };

  const result = await loadChannels({ baseUrl: BASE, fetchImpl });
  assert.equal(result.source, 'api');
  assert.equal(result.channels.length, 1);
  assert.equal(result.channels[0].id, 'db-1', '_id del backend se mapea a id');
});

test('loadChannels: cae al stub si la API falla y lo declara', async () => {
  const fetchImpl = async (url) => {
    if (url === `${BASE}/api/channels`) throw new TypeError('fetch failed');
    if (isStubUrl(url)) return jsonResponse(STUB_BODY);
    throw new Error(`URL inesperada: ${url}`);
  };

  const result = await loadChannels({ baseUrl: BASE, fetchImpl });
  assert.equal(result.source, 'stub');
  assert.equal(result.channels[0].id, 'stub-1');
  assert.match(String(result.reason), /red|fetch|no disponible/i);
});

test('loadChannels: cae al stub si la API devuelve una lista vacía', async () => {
  const fetchImpl = async (url) => {
    if (url === `${BASE}/api/channels`) return jsonResponse({ channels: [] });
    return jsonResponse(STUB_BODY);
  };

  const result = await loadChannels({ baseUrl: BASE, fetchImpl });
  assert.equal(result.source, 'stub');
  assert.match(result.reason, /vacía/i);
});

test('loadChannels: lanza error si también falla el stub', async () => {
  const fetchImpl = async () => {
    throw new TypeError('offline');
  };
  await assert.rejects(() => loadChannels({ baseUrl: BASE, fetchImpl }), /stub de canales/);
});

test('normalizeChannel completa campos y respeta isActive:false', () => {
  const channel = normalizeChannel({ name: 'Solo nombre' }, 0);
  assert.equal(channel.id, 'canal-1');
  assert.equal(channel.countryLabel, 'Sin país');
  assert.deepEqual(channel.categories, []);
  assert.equal(channel.isActive, true);

  const inactive = normalizeChannel({ _id: 'x', isActive: false, categories: ['Cine'] });
  assert.equal(inactive.id, 'x');
  assert.equal(inactive.isActive, false);
});

test('filterChannels filtra por país, categoría, texto y oculta inactivos', () => {
  const channels = [
    normalizeChannel({ id: 'a', name: 'Alfa', country: 'MX', categories: ['Noticias'] }),
    normalizeChannel({ id: 'b', name: 'Beta', country: 'ES', categories: ['Deportes'] }),
    normalizeChannel({ id: 'c', name: 'Gamma', country: 'MX', categories: ['Noticias', 'Cine'], isActive: false }),
  ];

  assert.equal(filterChannels(channels).length, 2, 'inactivo fuera');
  assert.deepEqual(filterChannels(channels, { country: 'MX' }).map((c) => c.id), ['a']);
  assert.deepEqual(filterChannels(channels, { category: 'Deportes' }).map((c) => c.id), ['b']);
  assert.deepEqual(filterChannels(channels, { query: 'gam' }).map((c) => c.id), []);
  assert.equal(filterChannels(channels, { query: 'ZETA' }).length, 0);
  assert.deepEqual(filterChannels(channels, { query: 'beta' }).map((c) => c.id), ['b']);
});

test('collectFilterOptions devuelve países y categorías ordenados', () => {
  const channels = [
    normalizeChannel({ country: 'MX', countryLabel: 'México', categories: ['Noticias'] }),
    normalizeChannel({ country: 'AR', countryLabel: 'Argentina', categories: ['Deportes', 'Noticias'] }),
  ];
  const options = collectFilterOptions(channels);
  assert.deepEqual(options.countries, [
    { value: 'AR', label: 'Argentina' },
    { value: 'MX', label: 'México' },
  ]);
  assert.deepEqual(options.categories, ['Deportes', 'Noticias']);
});

test('isSafeHlsUrl solo admite http(s) .m3u8 sin credenciales', () => {
  assert.equal(isSafeHlsUrl('https://example.test/master.m3u8'), true);
  assert.equal(isSafeHlsUrl('http://example.test/a.M3U8'), true);
  assert.equal(isSafeHlsUrl('https://user:pw@example.test/a.m3u8'), false);
  assert.equal(isSafeHlsUrl('ftp://example.test/a.m3u8'), false);
  assert.equal(isSafeHlsUrl('https://example.test/a.mp4'), false);
  assert.equal(isSafeHlsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHlsUrl(''), false);
});
