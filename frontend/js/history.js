/**
 * Página de historial (solo UI base).
 *
 * NO registra reproducciones ni persiste nada: `/api/history` requiere auth (TVH-30) y
 * backend (TVH-04). La tabla se rellena con filas de ejemplo marcadas como tales para
 * mostrar estructura y estados vacíos.
 */
import { bootPage } from './app.js';
import { showNotice } from './ui.js';

const tbody = document.querySelector('#history-body');
const notice = document.querySelector('#history-notice');

const SAMPLE_ROWS = [
  { channel: 'Canal Demo Uno', watchedAt: '—', duration: '—' },
  { channel: 'Canal Demo Dos', watchedAt: '—', duration: '—' },
];

async function init() {
  bootPage();
  showNotice(
    notice,
    'El historial no se registra todavía: depende de /api/history con sesión iniciada (TVH-30). Las filas son de ejemplo.',
    { variant: 'info' },
  );

  if (!tbody) return;
  tbody.replaceChildren();

  for (const row of SAMPLE_ROWS) {
    const tr = document.createElement('tr');
    tr.className = 'is-sample';

    for (const value of [row.channel, row.watchedAt, row.duration]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    tbody.append(tr);
  }
}

init();
