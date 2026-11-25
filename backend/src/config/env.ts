/**
 * Configuración de la aplicación leída desde variables de entorno.
 *
 * Este módulo NO abre conexiones ni puertos: solo normaliza y valida lo que
 * llega del entorno. Así los tests pueden importar la app sin efectos
 * secundarios.
 */

export type AuthConfig = {
  /** Clave de firma de los access tokens. Obligatoria cuando se usan los endpoints de auth. */
  jwtSecret: string | undefined;
  /** Clave de firma de los refresh tokens. Debe diferir de `jwtSecret`. */
  jwtRefreshSecret: string | undefined;
  /** Vida del access token (default no sensible de tiempo). */
  jwtAccessTtl: string;
  /** Vida del refresh token (default no sensible de tiempo). */
  jwtRefreshTtl: string;
};

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
  /** Parámetros de autenticación JWT. */
  auth: AuthConfig;
};

const DEFAULT_PORT = 3000;
const DEFAULT_READINESS_TIMEOUT_MS = 1500;
const DEFAULT_JWT_ACCESS_TTL = '15m';
const DEFAULT_JWT_REFRESH_TTL = '7d';

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

function readSecret(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  return value && value.length > 0 ? value : undefined;
}

function readTtl(raw: string | undefined, fallback: string): string {
  const value = raw?.trim();
  return value && value.length > 0 ? value : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const mongodbUri = env.MONGODB_URI?.trim();

  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: parsePort(env.PORT),
    mongodbUri: mongodbUri && mongodbUri.length > 0 ? mongodbUri : undefined,
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    readinessTimeoutMs: DEFAULT_READINESS_TIMEOUT_MS,
    auth: {
      // Los secretos NO tienen valor por defecto: si faltan, el servicio de
      // autenticación falla de forma explícita en vez de firmar con algo conocido.
      jwtSecret: readSecret(env.JWT_SECRET),
      jwtRefreshSecret: readSecret(env.JWT_REFRESH_SECRET),
      jwtAccessTtl: readTtl(env.JWT_ACCESS_TTL, DEFAULT_JWT_ACCESS_TTL),
      jwtRefreshTtl: readTtl(env.JWT_REFRESH_TTL, DEFAULT_JWT_REFRESH_TTL),
    },
  };
}
