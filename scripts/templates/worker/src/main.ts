console.log(`[{{SERVICE_NAME}}] started at ${new Date().toISOString()}`);

async function tick(): Promise<void> {
  console.log(`[{{SERVICE_NAME}}] tick`, new Date().toISOString());
  // TODO: 실제 작업 (큐 소비, 스크래핑, 정기 배치 등)
}

const INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 60_000);
const interval = setInterval(() => {
  tick().catch((err) => {
    console.error(`[{{SERVICE_NAME}}] error`, err);
  });
}, INTERVAL_MS);

tick().catch((err) => {
  console.error(`[{{SERVICE_NAME}}] initial run error`, err);
});

const shutdown = (signal: string) => () => {
  console.log(`[{{SERVICE_NAME}}] ${signal} received, shutting down`);
  clearInterval(interval);
  process.exit(0);
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
