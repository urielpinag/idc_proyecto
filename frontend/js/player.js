/**
 * Reproductor HLS basado en Shaka Player (cargado por CDN en cada página).
 * Adaptador fino y testeable de la librería global `shaka`.
 */

export const SHAKA_CDN_URL = 'https://ajax.googleapis.com/ajax/libs/shaka-player/4.8.10/shaka-player.compiled.js';

/** Configuración HLS recomendada para un `<video>` del navegador. */
export function buildPlayerConfig() {
  return {
    manifest: {
      retryParameters: { maxAttempts: 2, baseDelay: 300, timeout: 10000 },
    },
    streaming: {
      rebufferingGoal: 2,
      bufferingGoal: 10,
      retryParameters: { maxAttempts: 2, baseDelay: 300 },
    },
  };
}

export function isShakaAvailable(scope = globalThis) {
  return Boolean(scope && scope.shaka && scope.shaka.Player);
}

/** Nivel de soporte del navegador para HLS según Shaka. */
export function detectSupport(shakaScope = globalThis) {
  const shaka = shakaScope && shakaScope.shaka;
  if (!shaka || !shaka.Player) return 'unavailable';
  try {
    return shaka.Player.isBrowserSupported() ? 'supported' : 'unsupported';
  } catch {
    return 'unavailable';
  }
}

/**
 * Crea y prepara un reproductor Shaka sobre `videoElement`.
 * @throws si Shaka no está cargado o el navegador no soporta MSE.
 */
export async function createPlayer(videoElement, { shakaScope = globalThis } = {}) {
  if (!videoElement) throw new Error('Falta el elemento <video>.');
  if (!isShakaAvailable(shakaScope)) throw new Error('Shaka Player no está disponible.');

  const Player = shakaScope.shaka.Player;
  if (!Player.isBrowserSupported()) throw new Error('El navegador no soporta la reproducción de HLS con Shaka.');

  const player = new Player();
  player.configure(buildPlayerConfig());
  await player.attach(videoElement);
  return player;
}

/** Carga (`load`) un manifiesto en el reproductor ya adjuntado. */
export async function loadStream(player, url) {
  if (!player) throw new Error('Reproductor no inicializado.');
  await player.load(url);
  return true;
}

export async function destroyPlayer(player) {
  if (player && typeof player.destroy === 'function') await player.destroy();
}
