/**
 * {{SERVICE_NAME}} — 백그라운드 워커.
 *
 * homelab은 K8s CronJob을 쓰지 않고, Deployment 안에서 앱이 스스로 스케줄을 관리한다.
 * 주기 실행이 필요하면 setInterval / node-cron / BullMQ 등을 이 파일에서 설정.
 *
 * HTTP 노출 없음 → homelab의 _create-app.yml 실행 시 subdomain 을 비우면
 * Service / IngressRoute 없이 Deployment 만 생성된다.
 */

console.log(`[{{SERVICE_NAME}}] started at ${new Date().toISOString()}`);

async function tick(): Promise<void> {
  console.log(`[{{SERVICE_NAME}}] tick`, new Date().toISOString());
  // TODO: 실제 작업 (큐 소비, 스크래핑, 정기 배치 등)
}

// 주기 실행 (기본 60초 — 실제 주기로 조정)
const INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 60_000);
const interval = setInterval(() => {
  tick().catch((err) => {
    console.error(`[{{SERVICE_NAME}}] error`, err);
  });
}, INTERVAL_MS);

// 즉시 1회 실행
tick().catch((err) => {
  console.error(`[{{SERVICE_NAME}}] initial run error`, err);
});

// graceful shutdown
const shutdown = (signal: string) => () => {
  console.log(`[{{SERVICE_NAME}}] ${signal} received, shutting down`);
  clearInterval(interval);
  process.exit(0);
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
