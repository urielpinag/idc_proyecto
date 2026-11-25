import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPlayerConfig,
  createPlayer,
  destroyPlayer,
  detectSupport,
  isShakaAvailable,
  loadStream,
  SHAKA_CDN_URL,
} from '../js/player.js';

/** Doble mínimo de la API pública de Shaka Player. */
function createShakaDouble({ supported = true } = {}) {
  const state = { created: 0, attached: [], loaded: [], configured: [], destroyed: 0, listeners: [] };

  class FakePlayer {
    static isBrowserSupported() {
      return supported;
    }

    constructor() {
      state.created += 1;
    }

    configure(config) {
      state.configured.push(config);
    }

    async attach(element) {
      state.attached.push(element);
    }

    async load(url) {
      state.loaded.push(url);
      return Promise.resolve();
    }

    addEventListener(type, handler) {
      state.listeners.push({ type, handler });
    }

    async destroy() {
      state.destroyed += 1;
    }
  }

  return { scope: { shaka: { Player: FakePlayer } }, state };
}

const fakeVideo = { id: 'player-video' };

test('Shaka se carga desde una CDN https fija y versionada', () => {
  const url = new URL(SHAKA_CDN_URL);
  assert.equal(url.protocol, 'https:');
  assert.match(url.pathname, /shaka-player\/\d+\.\d+\.\d+\/shaka-player\.compiled\.js$/);
});

test('isShakaAvailable distingue presencia y ausencia de la librería', () => {
  assert.equal(isShakaAvailable({}), false);
  assert.equal(isShakaAvailable({ shaka: {} }), false);
  assert.equal(isShakaAvailable(createShakaDouble().scope), true);
});

test('detectSupport informa del soporte del navegador', () => {
  assert.equal(detectSupport({}), 'unavailable');
  assert.equal(detectSupport(createShakaDouble({ supported: true }).scope), 'supported');
  assert.equal(detectSupport(createShakaDouble({ supported: false }).scope), 'unsupported');
});

test('buildPlayerConfig incluye reintentos y objetivos de buffering', () => {
  const config = buildPlayerConfig();
  assert.ok(config.manifest.retryParameters.maxAttempts >= 1);
  assert.ok(config.streaming.bufferingGoal >= config.streaming.rebufferingGoal);
});

test('createPlayer inicializa y adjunta Shaka al <video>', async () => {
  const { scope, state } = createShakaDouble();
  const player = await createPlayer(fakeVideo, { shakaScope: scope });

  assert.ok(player, 'debe devolver una instancia de Player');
  assert.equal(state.created, 1);
  assert.deepEqual(state.attached, [fakeVideo]);
  assert.equal(state.configured.length, 1);
  assert.equal(state.configured[0].streaming.bufferingGoal, buildPlayerConfig().streaming.bufferingGoal);
});

test('createPlayer falla con mensajes claros si falta el vídeo o Shaka', async () => {
  await assert.rejects(() => createPlayer(null, { shakaScope: createShakaDouble().scope }), /elemento <video>/);
  await assert.rejects(() => createPlayer(fakeVideo, { shakaScope: {} }), /Shaka Player no está disponible/);
  await assert.rejects(
    () => createPlayer(fakeVideo, { shakaScope: createShakaDouble({ supported: false }).scope }),
    /no soporta/,
  );
});

test('loadStream carga una URL HLS segura en el reproductor', async () => {
  const { scope, state } = createShakaDouble();
  const player = await createPlayer(fakeVideo, { shakaScope: scope });
  const url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  await loadStream(player, url);
  assert.deepEqual(state.loaded, [url]);
  await assert.rejects(() => loadStream(null, url), /no inicializado/);
});

test('destroyPlayer es tolerante a valores nulos', async () => {
  const { scope, state } = createShakaDouble();
  const player = await createPlayer(fakeVideo, { shakaScope: scope });
  await destroyPlayer(player);
  assert.equal(state.destroyed, 1);
  await destroyPlayer(null);
  await destroyPlayer(undefined);
});
