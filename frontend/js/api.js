/**
 * Cliente de la API de TV Hub con respaldo explícito al stub local.
 *
 * Reglas de honestidad del scaffold (TVH-05):
 *  - Si el backend responde → datos reales.
 *  - Si el backend no responde o responde algo inesperado → se usa `stubs/channels.json`
 *    y se devuelve `source: 'stub'` para que la UI lo muestre como tal.
 *  - Nunca se simula login ni se guardan favoritos/historial: esta épica es solo de UI base.
 */
import { apiUrl, getApiBaseUrl } from './config.js';

export const STUB_URL = './stubs/channels.json';
const DEFAULT_TIMEOUT_MS = 4000;

export const SOURCE = Object.freeze({ API: 'api', STUB: 'stub' });

/** Ha de coincidir con `STUB_URL` cuando el navegador resuelve una URL relativa. */
export function isStubUrl(url) {
  return String(url || '').includes('stubs/channels.json');
}

/**
 * GET a la API con timeout, para que un backend caído no bloquee la UI.
 * @returns {Promise<{ ok: true, status: number, data: any } | { ok: false, status: number, reason: string }>}
 */
export async function requestJson(url, { fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (typeof fetchImpl !== 'function') {
    return { ok: false, status: 0, reason: 'fetch no disponible' };
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: controller ? controller.signal : undefined,
    });
    if (!res || !res.ok) {
      return { ok: false, status: res ? res.status : 0, reason: `HTTP ${res ? res.status : '?'}` };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (error) {
    const aborted = error && error.name === 'AbortError';
    return { ok: false, status: 0, reason: aborted ? 'timeout' : 'red no disponible' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Consulta `${API_BASE_URL}/health`.
 * @returns {Promise<{ status: 'ok'|'degraded'|'down'|'unknown', ok: boolean, message: string, raw?: any }>}
 */
export async function checkHealth({ baseUrl = getApiBaseUrl(), fetchImpl = globalThis.fetch, timeoutMs } = {}) {
  const result = await requestJson(apiUrl('/health', baseUrl), { fetchImpl, timeoutMs });

  if (!result.ok) {
    return { ok: false, status: 'down', message: 'Backend no disponible — mostrando datos de respaldo (stub).' };
  }

  const payload = result.data || {};
  const reported = String(payload.status || '').toLowerCase();
  const healthy = reported === '' || reported === 'ok' || reported === 'up' || reported === 'healthy';

  return healthy
    ? { ok: true, status: 'ok', message: 'Backend conectado.', raw: payload }
    : { ok: false, status: 'degraded', message: `Backend responde con estado «${payload.status}».`, raw: payload };
}

/** Lee el stub local de canales. */
export async function loadStubChannels({ fetchImpl = globalThis.fetch } = {}) {
  const result = await requestJson(STUB_URL, { fetchImpl });
  if (!result.ok || !result.data || !Array.isArray(result.data.channels)) {
    throw new Error('No se pudo leer el stub de canales.');
  }
  return result.data.channels;
}

/**
 * Obtiene los canales de `${API_BASE_URL}/api/channels` y cae al stub si falla.
 * @returns {Promise<{ channels: any[], source: 'api'|'stub', reason?: string }>}
 */
export async function loadChannels({ baseUrl = getApiBaseUrl(), fetchImpl = globalThis.fetch, timeoutMs } = {}) {
  const result = await requestJson(apiUrl('/api/channels', baseUrl), { fetchImpl, timeoutMs });

  const payload = result.ok ? result.data : null;
  const list = Array.isArray(payload) ? payload : payload && Array.isArray(payload.channels) ? payload.channels : null;

  if (list && list.length > 0) {
    return { channels: list.map(normalizeChannel), source: SOURCE.API };
  }

  const channels = await loadStubChannels({ fetchImpl });
  return {
    channels: channels.map(normalizeChannel),
    source: SOURCE.STUB,
    reason: result.ok ? 'La API devolvió una lista vacía.' : result.reason,
  };
}

/** Acepta `_id` (backend/DocumentDB) o `id` (stub) y garantiza los campos que usa la UI. */
export function normalizeChannel(raw, index = 0) {
  const channel = raw || {};
  return {
    id: String(channel.id || channel._id || `canal-${index + 1}`),
    name: String(channel.name || 'Canal sin nombre'),
    description: String(channel.description || ''),
    logoUrl: String(channel.logoUrl || ''),
    streamUrl: String(channel.streamUrl || ''),
    country: String(channel.country || ''),
    countryLabel: String(channel.countryLabel || channel.country || 'Sin país'),
    categories: Array.isArray(channel.categories) ? channel.categories.map(String) : [],
    isActive: channel.isActive !== false,
    playlistId: channel.playlistId ? String(channel.playlistId) : '',
  };
}

/** Filtra por país, categoría y texto (catálogo de la UI). */
export function filterChannels(channels, { country = '', category = '', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return channels.filter((channel) => {
    if (channel.isActive === false) return false;
    if (country && channel.country !== country) return false;
    if (category && !channel.categories.includes(category)) return false;
    if (needle && !channel.name.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/** Opciones únicas para los `<select>` de filtros. */
export function collectFilterOptions(channels) {
  const countries = new Map();
  const categories = new Set();
  for (const channel of channels) {
    if (channel.country) countries.set(channel.country, channel.countryLabel);
    for (const category of channel.categories) categories.add(category);
  }
  return {
    countries: [...countries].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'es')),
    categories: [...categories].sort((a, b) => a.localeCompare(b, 'es')),
  };
}

/**
 * Solo se permite reproducir URLs HLS absolutas http(s). Se descarta cualquier URL con
 * credenciales embebidas (`user:pass@`), protocolos raros o ficheros que no son `.m3u8`.
 */
export function isSafeHlsUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url || ''));
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  if (parsed.username || parsed.password) return false;
  return /\.m3u8$/i.test(parsed.pathname);
}

/** Persistencia de favoritos en `localStorage` (solo en esta rama de UI, no es la feature real). */
export function createLocalStore(storage = globalThis.localStorage) {
  const read = (key) => {
    try {
      const raw = storage ? storage.getItem(key) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const write = (key, value) => {
    try {
      if (storage) storage.setItem(key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible: la UI sigue funcionando sin persistir */
    }
  };
  return { read, write };
}
