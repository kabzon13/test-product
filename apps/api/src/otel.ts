// OTel SDK стоит всегда (Core), экспортёр включается только когда задан
// OTEL_EXPORTER_OTLP_ENDPOINT (модуль tempo).
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const sdk = new NodeSDK({
    serviceName: 'api',
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // health-чеки и метрики не трейсим — шум
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) =>
            ['/health', '/ready', '/metrics'].includes(req.url ?? ''),
        },
      }),
    ],
  });
  sdk.start();
  process.on('SIGTERM', () => {
    void sdk.shutdown();
  });
}
