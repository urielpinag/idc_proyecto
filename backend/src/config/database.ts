/**
 * Conexión única a MongoDB / Amazon DocumentDB mediante Mongoose.
 *
 * Importar este módulo NO abre conexión: la conexión se abre explícitamente
 * desde el arranque del servidor (`connectDatabase`) o desde las pruebas.
 *
 * Compatibilidad DocumentDB: solo se usan opciones del driver presentes en la
 * API de MongoDB ~4.0 (sin transacciones ni operadores nuevos).
 */

import mongoose from 'mongoose';

export const MONGO_CONNECT_TIMEOUT_MS = 10_000;

export type DatabaseStatus = 'connected' | 'connecting' | 'disconnected';

export function getDatabaseStatus(): DatabaseStatus {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}

/**
 * Abre la conexión con la URI indicada. Es idempotente: si ya hay una
 * conexión activa o en curso, la reutiliza.
 */
export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  if (!uri || uri.trim() === '') {
    throw new Error('MONGODB_URI no está definida.');
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
    connectTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
  });

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

/**
 * Comprueba que la conexión está viva ejecutando un comando `ping`
 * (soportado desde MongoDB 3.6 y por DocumentDB). Nunca lanza: devuelve el
 * estado para que `/ready` pueda responder 200/503.
 */
export async function isDatabaseReady(): Promise<boolean> {
  if (getDatabaseStatus() !== 'connected') {
    return false;
  }

  const { db } = mongoose.connection;
  if (!db) {
    return false;
  }

  try {
    await db.admin().command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
