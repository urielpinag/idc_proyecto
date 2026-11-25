/**
 * Página de inicio de sesión (solo maqueta).
 *
 * NO autentica nada: el formulario no envía credenciales a ningún servidor. El login real
 * (JWT + refresh rotativo, contraseñas con bcrypt) llega con TVH-30 en `/backend`.
 */
import { checkHealth } from './api.js';
import { bootPage } from './app.js';
import { showNotice } from './ui.js';

const form = document.querySelector('#login-form');
const notice = document.querySelector('#login-notice');
const healthHint = document.querySelector('#login-health');

/** Mensaje honesto que se muestra al intentar "enviar" el formulario. */
export const LOGIN_DISABLED_MESSAGE =
  'Inicio de sesión no implementado en este scaffold (TVH-05): llegará con el auth JWT del backend (TVH-30).';

export function describeHealth(health) {
  if (!health) return 'Estado del backend: sin comprobar.';
  if (health.status === 'ok') return 'Estado del backend: operativo (/health responde).';
  if (health.status === 'degraded') return `Estado del backend: ${health.message}`;
  return 'Estado del backend: sin conexión — el catálogo usará el stub local.';
}

async function init() {
  bootPage();

  const health = await checkHealth().catch(() => null);
  if (healthHint) healthHint.textContent = describeHealth(health);

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      showNotice(notice, LOGIN_DISABLED_MESSAGE, { variant: 'warning' });
    });
  }
}

init();
