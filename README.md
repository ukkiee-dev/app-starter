# app-starter

`ukkiee-dev/homelab`에 배포할 앱의 시작 템플릿. **generator 스크립트**로 타입·프레임워크별 boilerplate를 생성한다.

- pnpm workspace 모노레포
- `services/<service>/` 디렉토리 구조 강제 (homelab F안 규약)
- **3가지 서비스 타입**: `web` · `static` · `worker`
- **프레임워크 레이어**: type별로 하나 이상 선택 가능 (현재 web=hono, static=react)
- 모든 HTTP 서비스는 **port 3000** 통일 (homelab 매니페스트 일관성)
- SPA는 `window.__ENV__` 런타임 env 주입 내장
- TypeScript 스크립트는 **Node 24 native** 실행 (tsx 불필요)

---

## 빠른 시작

### 1. 이 template으로 새 레포 생성

GitHub에서 **Use this template → Create a new repository**로 `ukkiee-dev/<my-app>` 생성.

### 2. 초기화

```bash
git clone git@github.com:ukkiee-dev/<my-app>.git
cd <my-app>

pnpm run setup          # placeholder 치환 (git remote 기반 자동 감지)
pnpm install            # 의존성 설치 (@clack/prompts 등)
```

### 3. 서비스 추가 — **대화형 (권장)**

화살표 키 기반 `@clack/prompts` UI:

```bash
pnpm service:add
#   ┌  🚀 서비스 추가
#   │
#   ◇  서비스 이름
#   │  api
#   │
#   ◆  타입
#   │  ● web     HTTP API
#   │  ○ static  SPA (Caddy + 런타임 env 주입)
#   │  ○ worker  백그라운드 워커 (HTTP 노출 없음)
#   │
#   ●  프레임워크: hono (기본)       ← 옵션 1개면 자동 선택
#   │
#   ◇  템플릿 복사 중...
#   │
#   └  ✅ services/api 생성 완료 (type=web, framework=hono)
```

### 3'. 인자 모드 (CI/스크립트용)

```bash
pnpm service:add api     --type web    --framework hono   # HTTP API
pnpm service:add web     --type static --framework react  # SPA
pnpm service:add scraper --type worker                    # 백그라운드 (framework 없음)
```

### 4. 커밋 & push

```bash
git add -A && git commit -m "chore: scaffold services" && git push
```

### 5. homelab 프로비저닝 (서비스별 1회)

`pnpm service:add` 완료 시 해당 명령을 출력해준다. 예:

```bash
# web / static — subdomain 지정
gh workflow run _create-app.yml --repo ukkiee-dev/homelab \
  -f app-name=<my-app> -f service-name=api -f subdomain=api

# worker — subdomain 비움 → Deployment만
gh workflow run _create-app.yml --repo ukkiee-dev/homelab \
  -f app-name=<my-app> -f service-name=scraper
```

이후 `main`에 push할 때마다:
- `.github/workflows/build.yml` 의 동적 matrix가 `services/*/Dockerfile` 을 스캔
- GHCR 이미지 `<my-app>-<service>:<sha>` push
- homelab 매니페스트 tag 자동 갱신 → ArgoCD rolling update

---

## 타입 × 프레임워크

| type | framework | 런타임 | Port | Probe | env 주입 |
|---|---|---|---|---|---|
| `web` | `hono` | `node:24-alpine` | 3000 | `/health` (Hono route) | `process.env` 직접 |
| `static` | `react` | `caddy:2-alpine` | 3000 | `/health` (Caddyfile `handle`) | **`window.__ENV__` 런타임 주입** |
| `worker` | — | `node:24-alpine` | 없음 | 없음 | `process.env` 직접 |

---

## 환경변수 (SPA)

`static/react` 는 **Vite 빌드 타임 인라인** 방식. 홈랩은 단일 환경이므로 이미지 재빌드 감수 + Vite 표준 DX 우선.

```
.env.local / .env.production           ← VITE_API_URL=https://api.example.com
   ↓ (vite build 가 읽어 번들에 인라인)
dist/assets/index-<hash>.js            ← "https://api.example.com" 문자열 하드코딩
   ↓
앱 코드:  env.API_URL  ←  import.meta.env.VITE_API_URL
```

### Dev

```bash
cp services/<name>/.env.example services/<name>/.env.local
# .env.local 에 VITE_API_URL=http://localhost:3001 등 채움
pnpm --filter @<my-app>/<name> dev
```

`.env.local` 은 `.gitignore` 처리됨.

### Prod — Dockerfile build-args

`services/<name>/Dockerfile` 이 `ARG` 로 선언한 `VITE_*` 키들을 받아 `ENV` 로 넘김 → `vite build` 가 `process.env.VITE_*` 를 번들에 인라인.

**로컬 수동 빌드**:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.example.com \
  --build-arg VITE_SENTRY_DSN=... \
  -f services/<name>/Dockerfile \
  -t my-image .
```

**CI 파이프라인**: homelab `build-and-push` composite action 에 `build-args` input 을
전달하면 `docker/build-push-action` 에 pass-through 됩니다. 앱 레포 build.yml 예시:

```yaml
- uses: ukkiee-dev/homelab/.github/actions/build-and-push@main
  with:
    app-name:  ${{ needs.config.outputs.app-name }}
    service:   ${{ matrix.service }}
    image-tag: ${{ github.sha }}
    build-args: |
      VITE_API_URL=${{ secrets.VITE_API_URL }}
      VITE_SENTRY_DSN=${{ secrets.VITE_SENTRY_DSN }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

> 현재 homelab `build-and-push` composite action 은 `build-args` input 이 아직 없습니다.
> 필요 시 homelab 쪽 action.yml 에 한 줄 추가하면 바로 동작합니다 (docker/build-push-action@v6 가 이미 지원).

환경별 값을 바꾸려면 **이미지 재빌드 필요**. homelab 단일 환경 전제이므로 자연스러운 절충.

### 새 env 키 추가

1. `services/<name>/.env.example` 에 `VITE_NEW_VAR=` 추가
2. `services/<name>/src/vite-env.d.ts` 의 `ImportMetaEnv` 에 `readonly VITE_NEW_VAR: string` 추가
3. `services/<name>/src/env.ts` 의 객체에 `NEW_VAR: import.meta.env.VITE_NEW_VAR ?? ''` 추가
4. 앱 코드: `import { env } from './env'; env.NEW_VAR`

### 키 이름 규약

- **`.env.*` / 빌드 환경**: `VITE_` prefix 필수 (Vite 가 번들 노출 여부 결정)
- **앱 코드에서 사용하는 이름**: prefix 없이 (`env.API_URL`)

---

## 홈랩 연계 규약

- **이미지 이름**: `ghcr.io/ukkiee-dev/<my-app>-<service>:<tag>` — homelab `build-and-push` composite action이 강제
- **Dockerfile 경로**: 반드시 `services/<service>/Dockerfile`
- **K8s namespace**: `<my-app>` (한 프로젝트 = 한 namespace)
- **port**: HTTP 서비스는 3000 고정
- **.app-config.yml**: `health` 필드만. icon/description은 homelab의 `update-app-config.yml` dispatch 로 관리

---

## CI/CD 파이프라인

`.github/workflows/build.yml` 은 **수정 불필요** — 자동으로 동작:

| Job | 역할 |
|---|---|
| `discover` | `services/*/Dockerfile` 스캔 → 동적 matrix 생성 |
| `config` | homelab 매니페스트 존재 여부로 setup-done 판정 · `.app-config.yml` 변경된 서비스 추출 |
| `quality` | `pnpm lint / type-check / test` |
| `build` | homelab `build-and-push` composite action으로 GHCR push |
| `update-manifest` | homelab `_update-image.yml` 호출 → tag 갱신 |
| `prepare-health-matrix` · `sync-health` | `.app-config.yml` 변경 시 health만 sync |

`services/<name>/Dockerfile` 이 있는 것만 자동 matrix에 포함 → 서비스 추가/제거가 build.yml 수정 없음. **template 레포 자체는 `if: github.repository != 'ukkiee-dev/app-starter'`** 로 CI 전체 스킵.

---

## 서비스 제거

```bash
# 로컬
rm -rf services/<service>
git add -A && git commit -m "chore: remove <service>" && git push

# homelab (서비스만 제거, 프로젝트 유지)
gh workflow run teardown.yml --repo ukkiee-dev/homelab \
  -f app-name=<my-app> -f service=<service>
```

---

## 필수 GitHub Secrets

앱 레포 `Settings → Secrets and variables → Actions` 또는 org 레벨:

| Secret | 용도 |
|---|---|
| `HOMELAB_APP_ID` | homelab 매니페스트 갱신용 GitHub App |
| `HOMELAB_APP_PRIVATE_KEY` | 동 GitHub App private key |
| `TELEGRAM_BOT_TOKEN` | 빌드/배포 알림 (선택) |
| `TELEGRAM_CHAT_ID` | Telegram 대상 (선택) |

---

## template 자체 테스트

```bash
# 대화형 UI 직접 체험 — 임시 디렉토리에 init + install + 서브셸 진입
pnpm test:sandbox
# (샌드박스에서 자유롭게 pnpm service:add ... 실행 → exit → 자동 정리)

# CI-friendly 일괄 검증 — 3 type 모두 인자 모드로 생성
pnpm test:gen
pnpm test:gen --clean        # 생성 후 자동 삭제
```

---

## 디렉토리 구조

```
<my-app>/
├── scripts/
│   ├── init.sh                        # 레포 초기화 (placeholder 치환)
│   ├── add-service.ts                 # generator (Node 24 native TS 실행)
│   ├── tsconfig.json                  # scripts/ 전용 (types: ["node"])
│   ├── test-generate.sh               # CI-friendly 일괄 검증
│   ├── test-sandbox.sh                # 대화형 UI 체험 샌드박스
│   └── templates/                     # 타입·프레임워크별 boilerplate (건드리지 말 것)
│       ├── web/
│       │   └── hono/
│       ├── static/
│       │   └── react/
│       └── worker/
├── services/                          # pnpm service:add 가 여기에 생성
│   └── README.md                      # services/ 안내 (상설)
├── .github/workflows/
│   └── build.yml                      # 동적 discover — 수정 불필요
├── package.json                       # 루트 workspace (setup / service:add / test:gen / test:sandbox)
├── pnpm-workspace.yaml                # services/*
└── .gitignore
```

각 template 은 **자립형 tsconfig** 를 가진다 (루트 base 상속 없음) — 사용자가 서비스 생성 후 자유롭게 수정 가능.

---

## 기술 참고

- **Node 24 native TypeScript**: `.ts` 파일을 `node` 로 직접 실행 (`--experimental-strip-types` stable + unflagged). tsx 의존성 없음 → macOS Unix domain socket 경로 길이 제한(104 byte) 이슈 원천 차단
- **@clack/prompts**: Vite/Astro/Svelte 생태계와 동일한 대화형 UI 라이브러리
- **homelab composite action**: `ukkiee-dev/homelab/.github/actions/build-and-push`
- **homelab reusable workflows**: `_create-app.yml`, `_update-image.yml`, `_sync-app-config.yml`, `teardown.yml`, `update-app-config.yml`

---

## 참고 링크

- homelab: <https://github.com/ukkiee-dev/homelab>
