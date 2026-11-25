/**
 * Configuración de la aplicación leída desde variables de entorno.
 *
 * Este módulo NO abre conexiones ni puertos: solo normaliza y valida lo que
 * llega del entorno. Así los tests pueden importar la app sin efectos
 * secundarios.
 */

export type AppConfig = {
  nodeEnv: string;
  /** Puerto HTTP. Es opcional porque importar la app no debe requerir servidor. */
  port: number;
  /** Cadena de conexión a MongoDB/DocumentDB. Puede faltar si solo se importa la app. */
  mongodbUri: string | undefined;
  /** Lista de orígenes permitidos por CORS. */
  corsOrigins: string[];
  /** Timeout de la espera de readiness contra Mongo (ms). */
  readinessTimeoutMs: number;
};

const DEFAULT_PORT = 3000;
const DEFAULT_READINESS_TIMEOUT_MS = 1500;

export function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PORT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`PORT inválido: "${raw}". Debe ser un entero entre 0 y 65535.`);
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const mongodbUri = env.MONGODB_URI?.trim();

  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parsePort(env.PORT),
    mongodbUri: mongodbUri && mongodbUri.length > 0 ? mongodbUri : undefined,
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    readinessTimeoutMs: DEFAULT_READINESS_TIMEOUT_MS,
  };
}
