import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

const app = new Hono();

app.use(logger());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/', (c) => c.text('{{SERVICE_NAME}} is running\n'));

const port = Number(process.env.PORT ?? 3000);
const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[{{SERVICE_NAME}}] listening on :${info.port}`);
});

const shutdown = (signal: string) => () => {
  console.log(`[{{SERVICE_NAME}}] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
