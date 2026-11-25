/**
 * Arranque común de las páginas: estado del backend (/health) y marcado del menú.
 */
import { checkHealth } from './api.js';
import { markActiveNav } from './ui.js';

const STATUS_LABEL = { ok: 'operativo', degraded: 'degradado', down: 'sin conexión', unknown: 'desconocido' };

/** Pinta el indicador de `/health` en `#api-status`. */
export function renderHealthBadge(element, health) {
  if (!element) return;
  element.dataset.health = health.status;
  element.textContent = `API: ${STATUS_LABEL[health.status] || STATUS_LABEL.unknown}`;
  element.title = health.message || '';
}

/**
 * Consulta `/health` y actualiza el indicador. Devuelve el resultado para que cada
 * página decida si muestra el stub.
 */
export async function refreshHealth({ fetchImpl, baseUrl } = {}) {
  const badge = document.querySelector('#api-status');
  const health = await checkHealth({ fetchImpl, baseUrl });
  renderHealthBadge(badge, health);

  const detail = document.querySelector('#api-status-detail');
  if (detail) detail.textContent = health.message;

  return health;
}

export function bootPage() {
  markActiveNav();
  const healthPromise = refreshHealth();
  const refresh = document.querySelector('#api-check-again');
  if (refresh) {
    refresh.addEventListener('click', (event) => {
      event.preventDefault();
      refreshHealth();
    });
  }
  return healthPromise;
}
