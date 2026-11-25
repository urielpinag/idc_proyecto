/**
 * Página de favoritos (solo UI base).
 *
 * NO hay favoritos persistentes ni reales: la API `/api/favorites` llega con auth (TVH-30)
 * y el backend (TVH-04). Esta página explica el estado y muestra el catálogo del stub para
 * dejar claro cómo se verá la lista cuando exista la feature.
 */
import { loadChannels } from './api.js';
import { bootPage } from './app.js';
import { createChannelCard, showNotice } from './ui.js';

const list = document.querySelector('#favorites-list');
const notice = document.querySelector('#favorites-notice');
const source = document.querySelector('#favorites-source');

async function init() {
  bootPage();
  showNotice(
    notice,
    'Los favoritos todavía no se guardan: requieren inicio de sesión y la API /api/favorites (auth real en TVH-30). Esta página es solo la base visual.',
    { variant: 'info' },
  );

  try {
    const result = await loadChannels();
    if (source) {
      source.textContent = result.source === 'api' ? 'Origen: API' : 'Origen: Stub (datos sintéticos)';
      source.dataset.source = result.source;
    }

    if (!list) return;
    list.replaceChildren();

    // Se pintan los canales como "candidatos": los botones están deshabilitados a propósito.
    for (const channel of result.channels.slice(0, 3)) {
      list.append(createChannelCard(channel, { onSelect: () => {} }));
    }

    if (result.channels.length === 0) {
      showNotice(list, 'El catálogo de respaldo está vacío.', { variant: 'info' });
    }
  } catch (error) {
    showNotice(list, `No se pudo cargar el catálogo de respaldo: ${error.message}`, { variant: 'error' });
  }
}

init();
