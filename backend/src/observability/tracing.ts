/**
 * Instrumentación de trazas con OpenTelemetry (TVH-41).
 *
 * Sigue el patrón oficial *instrumentation-file*: `index.ts` importa este
 * módulo ANTES que cualquier módulo de la app y el SDK arranca de forma
 * SÍNCRONA a nivel de módulo, para que las auto-instrumentaciones envuelvan
 * `http`/`express` y las llamadas salientes (mongoose/undici) desde el primer
 * momento. Si se dejara para una promesa (`import()` dinámico o `void
 * init().then(...)`) los hooks se instalarían tarde y no habría spans.
 *
 * El backend solo exporta por OTLP HTTP; el Collector (ADOT, en el clúster) es
 * el encargado de reenviar a X-Ray.
 *
 * Se desactiva limpiamente si:
 * - `OTEL_SDK_DISABLED === 'true'` (convención oficial de OpenTelemetry), o
 * - `OTEL_TRACING_ENABLED !== 'true'` (tests, local y Dev sin collector).
 *
 * En ese caso no se construye ni se arranca el SDK: el proceso y las pruebas
 * siguen funcionando igual y sin latencia añadida.
 */

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

const otlpEndpointDefault = 'http://localhost:4318';
const serviceName = 'tvhub-api';

/**
 * Handle mínimo del SDK arrancado al importar este módulo, o `null` si las
 * trazas están desactivadas. Lo usa `index.ts` para el apagado ordenado.
 */
export type TracingHandle = {
  shutdown: () => Promise<void>;
  enabled: true;
};

function isTracingDisabled(): boolean {
  return process.env.OTEL_SDK_DISABLED === 'true' || process.env.OTEL_TRACING_ENABLED !== 'true';
}

function createSdk(): NodeSDK {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || otlpEndpointDefault;

  return new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': process.env.OTEL_SERVICE_NAME?.trim() || serviceName,
      'deployment.environment':
        process.env.DEPLOY_ENV?.trim() || process.env.NODE_ENV?.trim() || 'development',
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint.replace(/\/+$/, '')}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Ruidoso y sin valor para la traza de negocio: ficheros y DNS.
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });
}

function logStartError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'error desconocido';
  process.stderr.write(
    `${JSON.stringify({
      level: 'error',
      message: `No se pudo iniciar OpenTelemetry: ${message}`,
      timestamp: new Date().toISOString(),
    })}\n`,
  );
}

/**
 * Arranque síncrono a nivel de módulo. Se ejecuta en cuanto `index.ts` importa
 * este fichero, antes de app/rutas/mongoose. Con las trazas desactivadas el
 * guard sale sin registrar nada.
 */
function startTracing(): TracingHandle | null {
  if (isTracingDisabled()) {
    return null;
  }

  try {
    const sdk = createSdk();
    // `start()` registra las instrumentaciones de forma síncrona; la fase
    // asíncrona interna del SDK no es necesaria para el patcheo.
    void sdk.start();
    return { enabled: true, shutdown: () => sdk.shutdown() };
  } catch (error) {
    // Si falla el exporter (collector caído al arrancar), no debe tumbar la API.
    logStartError(error);
    return null;
  }
}

const tracingHandle: TracingHandle | null = startTracing();

/**
 * Handle del SDK ya arrancado al importar este módulo, o `null` si las trazas
 * están desactivadas. Lo usa `index.ts` para el apagado ordenado.
 */
export function getTracingHandle(): TracingHandle | null {
  return tracingHandle;
}
