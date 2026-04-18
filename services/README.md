# services/

`pnpm service:add`로 생성한 서비스가 여기 들어갑니다.

## 생성

```bash
pnpm service:add api     --type web       # Node.js + Hono
pnpm service:add web     --type static    # Vite + React + Caddy SPA
pnpm service:add scraper --type worker    # 백그라운드 워커
```

## 규약

- 각 서비스는 독립적인 pnpm 워크스페이스 패키지 (`@<app>/<service>`)
- `services/<name>/Dockerfile` 이 있으면 CI(`.github/workflows/build.yml`)가
  자동으로 빌드 대상에 포함 — 명시적 matrix 관리 불필요
- 모든 HTTP 서비스는 port 3000 listen (homelab 규약)
- 이미지 이름: `ghcr.io/ukkiee-dev/<app>-<service>:<tag>`

## 구조 (add-service.sh 생성 결과)

| type | 주요 파일 |
|---|---|
| `web` | `Dockerfile`, `package.json` (Hono), `src/main.ts`, `tsconfig.json`, `.app-config.yml` |
| `static` | `Dockerfile` (Caddy), `Caddyfile`, `docker-entrypoint.sh`, `package.json` (Vite+React), `vite.config.ts`, `index.html`, `src/{main,App,env}.tsx`, `tsconfig.json`, `.app-config.yml` |
| `worker` | `Dockerfile`, `package.json`, `src/main.ts`, `tsconfig.json` |

## 서비스 제거

```bash
rm -rf services/<service>
gh workflow run teardown.yml --repo ukkiee-dev/homelab \
  -f app-name=<my-app> -f service=<service>
```
