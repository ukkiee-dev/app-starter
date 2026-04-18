# ── build stage ───────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY services/{{SERVICE_NAME}}/package.json ./services/{{SERVICE_NAME}}/

RUN pnpm install --frozen-lockfile
COPY services/{{SERVICE_NAME}} ./services/{{SERVICE_NAME}}

RUN pnpm --filter @{{APP_NAME}}/{{SERVICE_NAME}} build
RUN pnpm deploy --filter=@{{APP_NAME}}/{{SERVICE_NAME}} --prod /prod-out

# ── runtime stage ─────────────────────────────────────────────
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /prod-out/node_modules ./node_modules
COPY --from=builder /prod-out/dist          ./dist
COPY --from=builder /prod-out/package.json  ./

USER 1000
EXPOSE 3000

CMD ["node", "dist/main.js"]
