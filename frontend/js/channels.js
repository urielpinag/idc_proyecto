/**
 * Página de canales: lista los canales del backend o del stub y reproduce HLS con Shaka.
 *
 * Honestidad del scaffold: no hay sesión iniciada, así que el catálogo se muestra en modo
 * solo lectura y marcado con la etiqueta de origen (`API` o `Stub`).
 */
import { collectFilterOptions, filterChannels, isSafeHlsUrl, loadChannels } from './api.js';
import { bootPage } from './app.js';
import { buildPlayerConfig, createPlayer, destroyPlayer, detectSupport, loadStream, SHAKA_CDN_URL } from './player.js';
import { createChannelCard, fillSelect, showNotice } from './ui.js';

const els = {
  list: document.querySelector('#channels-list'),
  source: document.querySelector('#channels-source'),
  notice: document.querySelector('#channels-notice'),
  country: document.querySelector('#filter-country'),
  category: document.querySelector('#filter-category'),
  search: document.querySelector('#filter-search'),
  count: document.querySelector('#channels-count'),
  player: document.querySelector('#player-video'),
  playerTitle: document.querySelector('#player-title'),
  playerStatus: document.querySelector('#player-status'),
  playerHint: document.querySelector('#player-hint'),
  shakaState: document.querySelector('#shaka-state'),
};

let allChannels = [];
let selectedId = '';
let player = null;

function currentFilters() {
  return {
    country: els.country ? els.country.value : '',
    category: els.category ? els.category.value : '',
    query: els.search ? els.search.value : '',
  };
}

function setSourceLabel(source) {
  if (!els.source) return;
  els.source.textContent = source === 'api' ? 'Origen: API' : 'Origen: Stub (datos sintéticos)';
  els.source.dataset.source = source;
}

function applyFilters() {
  renderList(filterChannels(allChannels, currentFilters()));
}

function renderList(channels) {
  if (!els.list) return;
  els.list.replaceChildren();

  if (els.count) {
    const plural = channels.length === 1 ? '' : 'es';
    els.count.textContent = `${channels.length} canal${plural} visible${plural}`;
  }

  if (channels.length === 0) {
    showNotice(els.list, 'No hay canales que coincidan con los filtros.', { variant: 'info' });
    return;
  }

  for (const channel of channels) {
    els.list.append(
      createChannelCard(channel, {
        selectedId,
        onSelect: (selected) => play(selected),
      }),
    );
  }
}

async function ensurePlayer() {
  if (player) return player;
  player = await createPlayer(els.player);
  player.addEventListener('error', () => {
    showNotice(els.playerStatus, 'Shaka no pudo reproducir el stream (red o formato).', { variant: 'error' });
    if (els.shakaState) els.shakaState.textContent = 'Shaka: error de reproducción';
  });
  if (els.shakaState) els.shakaState.textContent = `Shaka: inicializado (reintentos ${buildPlayerConfig().manifest.retryParameters.maxAttempts})`;
  return player;
}

async function play(channel) {
  selectedId = channel.id;
  applyFilters();

  if (els.playerTitle) els.playerTitle.textContent = channel.name;

  if (!isSafeHlsUrl(channel.streamUrl)) {
    showNotice(els.playerStatus, 'Este canal no tiene una URL HLS válida (se exige http(s) y .m3u8).', { variant: 'error' });
    return;
  }

  if (els.playerStatus) els.playerStatus.replaceChildren();

  const support = detectSupport();
  if (els.shakaState) els.shakaState.textContent = `Shaka: ${support}`;

  try {
    const instance = await ensurePlayer();
    await loadStream(instance, channel.streamUrl);
    await els.player.play().catch(() => {
      /* Autoplay bloqueado por el navegador: el usuario pulsa ▶ en el vídeo. */
    });
  } catch (error) {
    const message = support === 'unsupported'
      ? 'El navegador no soporta HLS con Shaka; prueba un navegador actualizado.'
      : `No se pudo iniciar la reproducción: ${error.message}`;
    showNotice(els.playerStatus, message, { variant: 'error' });
    if (els.shakaState) els.shakaState.textContent = 'Shaka: error de inicialización';
  }
}

async function init() {
  bootPage();

  if (els.shakaState) {
    const support = detectSupport();
    els.shakaState.textContent = `Shaka: ${support}`;
    els.shakaState.title = SHAKA_CDN_URL;
  }

  if (els.playerHint) {
    els.playerHint.textContent = 'Fixtures HLS públicos de tests de terceros (sin credenciales). Pulsa «Reproducir» para cargarlos.';
  }

  try {
    const result = await loadChannels();
    allChannels = result.channels;
    setSourceLabel(result.source);

    if (result.source === 'stub') {
      showNotice(
        els.notice,
        `Mostrando el stub local porque la API no respondió (${result.reason || 'sin detalle'}).`,
        { variant: 'warning' },
      );
    }

    const options = collectFilterOptions(allChannels);
    fillSelect(els.country, options.countries, { placeholder: 'Todos los países' });
    fillSelect(els.category, options.categories.map((c) => ({ value: c, label: c })), { placeholder: 'Todas las categorías' });

    renderList(filterChannels(allChannels, {}));
  } catch (error) {
    showNotice(els.notice, `No se pudo cargar ni el catálogo ni el stub: ${error.message}`, { variant: 'error' });
  }
}

for (const el of [els.country, els.category, els.search]) {
  if (!el) continue;
  el.addEventListener('input', applyFilters);
  el.addEventListener('change', applyFilters);
}

window.addEventListener('beforeunload', () => {
  destroyPlayer(player);
});

init();
