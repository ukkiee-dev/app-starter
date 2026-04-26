# app-starter

`ukkiee-dev/homelab`에 배포할 앱을 빠르게 시작하기 위한 템플릿이다. `pnpm service:add`로 `services/<name>/` 아래에 서비스 템플릿을 생성한다.

## 요구사항

- Node.js 24+
- pnpm 10+

## 빠른 시작

```bash
git clone git@github.com:ukkiee-dev/<my-app>.git
cd <my-app>

pnpm run setup
pnpm install
pnpm service:add
```

`pnpm run setup`은 `__APP_NAME__` placeholder를 현재 레포 이름으로 치환한다.

## 서비스 생성

대화형:

```bash
pnpm service:add
```

인자 모드:

```bash
pnpm service:add api --type web --framework hono
pnpm service:add web --type static --framework react
pnpm service:add scraper --type worker
```

지원 타입:

- `web`: Hono 기반 HTTP API
- `static`: Vite + React SPA
- `worker`: 백그라운드 워커

기본 규약:

- 모든 HTTP 서비스는 port `3000`
- 서비스 루트는 `services/<service>/`
- `services/<service>/Dockerfile` 이 있으면 CI 빌드 대상에 자동 포함
- 서비스 설정의 기준 파일은 `services/<service>/.app-config.yml`

## 배포 흐름

1. `pnpm service:add`로 서비스를 생성한다.
2. 생성된 서비스의 `.app-config.yml`을 필요에 맞게 수정한다.
3. 서비스별로 한 번만 `create-app.yml`을 실행한다.
4. 이후 `main`에 push하면 CI가 이미지를 빌드하고 homelab 매니페스트를 갱신한다.

예시:

```bash
gh workflow run create-app.yml -f service-name=api -f subdomain=api
gh workflow run create-app.yml -f service-name=scraper
```

## `.app-config.yml` 메모

HTTP 서비스는 `type`을 생략하고, worker만 `type: worker`를 쓴다.

```yaml
health: /health
icon: mdi-application
description: ""
```

DB가 필요하면 아래 둘 중 하나를 쓴다.

```yaml
database:
  name: myapp_db
```

```yaml
database:
  ref: api
```

## 자주 쓰는 명령

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:sandbox
```

## 참고

- [services/README.md](/Users/ukyi/workspace/app-starter/services/README.md)
- homelab: <https://github.com/ukkiee-dev/homelab>
