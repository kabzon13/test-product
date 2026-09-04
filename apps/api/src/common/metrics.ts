import type { NextFunction, Request, Response } from 'express';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

const httpTotal = new Counter({
  name: 'http_requests_total',
  help: 'HTTP requests total',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

const httpInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'HTTP requests currently being served',
  registers: [registry],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics' || req.path === '/health' || req.path === '/ready') {
    next();
    return;
  }
  httpInFlight.inc();
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = (req.route as { path?: string } | undefined)?.path
      ? `${req.baseUrl}${(req.route as { path: string }).path}`
      : 'unmatched';
    const labels = { method: req.method, route, status: String(res.statusCode) };
    end(labels);
    httpTotal.inc(labels);
    httpInFlight.dec();
  });
  next();
}
