/**
 * Configuración del frontend.
 *
 * `API_BASE_URL` llega desde el servidor estático (`/config.js`, generado a partir de
 * la variable de entorno `API_BASE_URL`). Si no existe, se usa el puerto acordado para
 * `/backend` en desarrollo (`http://localhost:3000`).
 */
const FALLBACK_API_BASE_URL = 'http://localhost:3000';

function readWindowConfig() {
  if (typeof window !== 'undefined' && window.TVHUB_CONFIG) return window.TVHUB_CONFIG;
  return {};
}

/** Normaliza una base URL: sin espacios y sin barras finales. */
export function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

export function getApiBaseUrl(config = readWindowConfig()) {
  return normalizeBaseUrl(config.apiBaseUrl) || FALLBACK_API_BASE_URL;
}

/** Construye una URL absoluta para un path de la API (`/health`, `/api/channels`…). */
export function apiUrl(path, baseUrl = getApiBaseUrl()) {
  return `${normalizeBaseUrl(baseUrl)}${path.startsWith('/') ? path : `/${path}`}`;
}
