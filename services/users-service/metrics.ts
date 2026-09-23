import client from 'prom-client';
import type { NextFunction, Request, Response } from 'express';

// One registry per process - carries both the default Node.js/process
// metrics (CPU, memory, event loop lag, GC) and the HTTP metrics below.
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
    registers: [register],
});

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        // req.route is only set once Express matches a route, but 'finish'
        // fires after the handler runs - by then it's populated. Falls back
        // to req.path (e.g. for 404s, where no route ever matched) so we
        // don't create one label series per unmatched URL.
        const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
        const labels = { method: req.method, route, status_code: String(res.statusCode) };

        httpRequestDuration.observe(labels, durationSeconds);
        httpRequestsTotal.inc(labels);
    });

    next();
}
