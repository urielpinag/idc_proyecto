import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Levanta una instancia efímera de MongoDB para las pruebas.
 *
 * La versión se fija explícitamente (ver `MONGOMS_VERSION` en `tests/setup-env.ts`)
 * para no depender de la versión por defecto de `mongodb-memory-server`.
 */
export async function startInMemoryMongo(): Promise<MongoMemoryServer> {
  return MongoMemoryServer.create();
}
