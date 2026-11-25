/**
 * Instrumentación de trazas con OpenTelemetry (TVH-41).
 *
 * Se inicializa ANTES que cualquier módulo de la app para que las
 * auto-instrumentaciones envuelvan `http`/`express` y las llamadas salientes
 * (mongoose/undici). El backend solo exporta por OTLP HTTP; el Collector
 * (ADOT, en el clúster) es el encargado de reenviar a X-Ray.
 *
 * Se desactiva limpiamente si:
 * - `OTEL_SDK_DISABLED === 'true'` (convención oficial de OpenTelemetry), o
 * - `OTEL_TRACING_ENABLED !== 'true'` (tests, local y Dev sin collector).
 *
 * En ese caso no se registra el SDK ni se crean timers/handles: el proceso y
 * las pruebas siguen funcionando igual y sin latencia añadida.
 */

const otlpEndpointDefault = 'http://localhost:4318';
const serviceName = 'tvhub-api';

function isTracingDisabled(): boolean {
  return process.env.OTEL_SDK_DISABLED === 'true' || process.env.OTEL_TRACING_ENABLED !== 'true';
}

/**
 * Arranca el `NodeSDK` de OpenTelemetry. Es `await`-able para poder esperar a
 * `sdk.shutdown()` en el apagado ordenado (index.ts) y no perder trazas
 * pendientes.
 */
export type TracingHandle = {
  shutdown: () => Promise<void>;
  enabled: true;
};

export async function startTracing(): Promise<TracingHandle | null> {
  if (isTracingDisabled()) {
    return null;
  }

  // Import dinámico: si las trazas están apagadas no se carga ni un módulo de
  // OpenTelemetry (los tests y el modo local no pagan ese coste).
  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
  const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
  const { resourceFromAttributes } = await import('@opentelemetry/resources');

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || otlpEndpointDefault;

  const sdk = new NodeSDK({
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

  await sdk.start();

  return {
    enabled: true,
    shutdown: () => sdk.shutdown(),
  };
}

/**
 * Arranque "de disparo y olvido" para `index.ts`: si falla el exporter
 * (collector caído al arrancar), no debe tumbar la API.
 */
export async function initTracing(): Promise<TracingHandle | null> {
  try {
    return await startTracing();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'error desconocido';
    process.stderr.write(
      `${JSON.stringify({
        level: 'error',
        message: `No se pudo iniciar OpenTelemetry: ${message}`,
        timestamp: new Date().toISOString(),
      })}\n`,
    );
    return null;
  }
}
