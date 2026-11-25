/**
 * Variables de entorno fijadas antes de cargar la aplicación en las pruebas.
 *
 * No se abre ninguna conexión ni puerto aquí: importar `src/app.ts` debe ser
 * libre de efectos secundarios.
 */

process.env.NODE_ENV = 'test';

// Secretos SOLO para pruebas: valores evidentemente falsos y distintos entre
// sí, para que ningún test dependa de un secreto real.
process.env.JWT_SECRET = 'test-access-secret-no-usar-en-produccion';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-no-usar-en-produccion';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';

// mongodb-memory-server: fijar la versión del binario que se descarga y
// reutilizar el binario ya descargado entre ejecuciones.
if (!process.env.MONGOMS_VERSION) {
  process.env.MONGOMS_VERSION = '6.0.14';
}
if (!process.env.MONGOMS_DOWNLOAD_DIR) {
  process.env.MONGOMS_DOWNLOAD_DIR = `${process.cwd()}/.cache/mongodb-binaries`;
}
