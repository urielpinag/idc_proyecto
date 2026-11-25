#!/usr/bin/env node
/**
 * Verificación de la reproducción HLS real en Chrome headless (uso manual, no en CI).
 *
 *   node scripts/verify-hls.mjs [url-frontend]
 *
 * Comprueba, con la Chrome instalada en el sistema, que Shaka Player se carga desde la
 * CDN y que el `<video id="player-video">` avanza (`currentTime > 0`) con el fixture HLS.
 * Requiere red. NO forma parte de `npm test`.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FRONTEND = process.argv[2] || 'http://127.0.0.1:8080';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9333;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rpc(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== id) return;
      ws.removeEventListener('message', onMessage);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForTargets() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      /* Chrome aún arrancando */
    }
    await sleep(250);
  }
  throw new Error('Chrome no expuso /json/list');
}

const profile = await mkdtemp(join(tmpdir(), 'tvhub-hls-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profile}`,
  '--autoplay-policy=no-user-gesture-required',
  '--no-first-run',
  '--disable-gpu',
  'about:blank',
]);

let exitCode = 0;
try {
  const target = await waitForTargets();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  await rpc(ws, 1, 'Runtime.enable');
  await rpc(ws, 2, 'Page.enable');
  await rpc(ws, 3, 'Page.navigate', { url: `${FRONTEND}/channels.html` });
  await sleep(2500);

  const shakaLoaded = await rpc(ws, 4, 'Runtime.evaluate', {
    expression: 'Boolean(window.shaka && window.shaka.Player)',
    returnByValue: true,
  });
  console.log('Shaka cargado desde CDN:', shakaLoaded.result.value);

  const clicked = await rpc(ws, 5, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.channel-card .btn-primary');
      if (!btn) return 'sin botón Reproducir';
      btn.click();
      return 'clic en Reproducir: ' + btn.closest('.channel-card').querySelector('.channel-name').textContent;
    })()`,
    returnByValue: true,
  });
  console.log(clicked.result.value);

  let progress = null;
  for (let i = 0; i < 24; i += 1) {
    const state = await rpc(ws, 10 + i, 'Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('#player-video');
        return JSON.stringify({
          currentTime: v ? v.currentTime : null,
          readyState: v ? v.readyState : null,
          error: v && v.error ? v.error.code : null,
          shaka: (document.querySelector('#shaka-state') || {}).textContent || '',
          playerStatus: (document.querySelector('#player-status') || {}).textContent || '',
        });
      })()`,
      returnByValue: true,
    });
    progress = JSON.parse(state.result.value);
    if (progress.currentTime > 0.5) break;
    await sleep(500);
  }

  console.log('Estado del <video>:', JSON.stringify(progress));
  const playing = progress && progress.currentTime > 0.5;
  console.log(playing ? '✔ Reproducción HLS verificada (currentTime avanza).' : '✖ No se observó avance de reproducción.');
  if (!playing) exitCode = 1;

  ws.close();
} catch (error) {
  console.error('✖ Error de verificación:', error.message);
  exitCode = 1;
} finally {
  chrome.kill('SIGTERM');
  await sleep(600);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {
    /* perfil temporal de Chrome: si no se puede borrar, queda en TMPDIR */
  });
}

process.exit(exitCode);
