import { pathToFileURL } from 'node:url';
import type { Server } from 'node:http';

/**
 * `true` cuando el módulo se ejecuta como programa principal
 * (`node dist/index.js`) y no al importarlo (tests, `tsx`).
 */
const entrypointPath = process.argv[1];

export const isDirectRun: boolean =
  entrypointPath !== undefined &&
  entrypointPath.trim() !== '' &&
  import.meta.url === pathToFileURL(entrypointPath).href;

/**
 * Puerto efectivo de un servidor ya escuchando: útil cuando PORT=0 para dejar
 * que el sistema operativo asigne uno libre (caso de los tests).
 */
export function resolveListeningPort(
  address: ReturnType<Server['address']>,
  fallbackPort: number,
): number {
  if (typeof address === 'object' && address !== null) {
    return address.port;
  }
  return fallbackPort;
}
