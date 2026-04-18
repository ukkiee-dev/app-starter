# ── build stage ───────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /repo
RUN corepack enable

# Vite 빌드 타임 환경변수 (build-args 로 주입) — 키 추가 시 .env.example / vite-env.d.ts / env.ts 에도 반영
ARG VITE_PORT=$VITE_PORT

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/{{SERVICE_NAME}}/package.json ./services/{{SERVICE_NAME}}/

RUN pnpm install --frozen-lockfile
COPY services/{{SERVICE_NAME}} ./services/{{SERVICE_NAME}}

RUN pnpm --filter @{{APP_NAME}}/{{SERVICE_NAME}} build

# ── runtime: caddy port 3000 ─────────────────────────────────
FROM caddy:2-alpine

COPY services/{{SERVICE_NAME}}/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /repo/services/{{SERVICE_NAME}}/dist /srv

EXPOSE 3000
