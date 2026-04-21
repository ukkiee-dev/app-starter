#!/usr/bin/env node
/**
 * 서비스 추가 — scripts/templates/<type>/ 을 services/<name>/ 으로 복사·치환.
 *
 * Usage (인자):
 *   pnpm service:add <service-name> --type <web|static|worker>
 *
 * Usage (대화형):
 *   pnpm service:add                # 화살표 UI 로 모두 prompt
 *   pnpm service:add api            # type만 prompt
 */

import { intro, outro, text, select, cancel, isCancel, log } from '@clack/prompts';
import { chmod, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

type ServiceType = 'web' | 'static' | 'worker';
const SERVICE_TYPES: readonly ServiceType[] = ['web', 'static', 'worker'] as const;

// type 별로 지원하는 framework 목록.
// 빈 배열이면 framework 레이어 없이 templates/<type>/ 자체가 템플릿.
// 단일 항목이면 prompt 없이 자동 선택.
const FRAMEWORKS_BY_TYPE = {
  web: ['hono'],
  static: ['react'],
  worker: [] as string[],
} as const satisfies Record<ServiceType, readonly string[]>;

type Framework = (typeof FRAMEWORKS_BY_TYPE)[ServiceType][number];

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(SCRIPT_DIR, '..');

// ── argv 파싱 (누락은 대화형으로 채움) ───────────────────────
const argv = process.argv.slice(2);

if (argv.includes('-h') || argv.includes('--help')) {
  console.log('Usage:');
  console.log('  pnpm service:add <service-name> --type <web|static|worker>');
  console.log('  pnpm service:add                  # 대화형');
  process.exit(0);
}

let serviceName: string | undefined =
  argv[0] && !argv[0].startsWith('--') ? argv[0] : undefined;

let type: ServiceType | undefined;
const typeIdx = argv.indexOf('--type');
if (typeIdx !== -1) {
  const candidate = argv[typeIdx + 1];
  if (!candidate) {
    console.error('::error::--type 뒤에 값이 없습니다 (web | static | worker)');
    process.exit(1);
  }
  if ((SERVICE_TYPES as readonly string[]).includes(candidate)) {
    type = candidate as ServiceType;
  } else {
    console.error(`::error::알 수 없는 --type 값: '${candidate}' (web | static | worker)`);
    process.exit(1);
  }
}

let framework: Framework | undefined;
const fwIdx = argv.indexOf('--framework');
if (fwIdx !== -1) {
  const candidate = argv[fwIdx + 1];
  if (!candidate) {
    console.error('::error::--framework 뒤에 값이 없습니다');
    process.exit(1);
  }
  framework = candidate as Framework;
}

// ── 루트 package.json 에서 app 이름 ──────────────────────────
interface PackageJson {
  name?: string;
}
const pkgJson = JSON.parse(
  await readFile(join(ROOT_DIR, 'package.json'), 'utf8'),
) as PackageJson;
const appName = pkgJson.name ?? '';

if (!appName || appName === '__APP_NAME__') {
  intro('🚀 서비스 추가');
  cancel('초기화 필요 — 루트 package.json 의 name 이 아직 __APP_NAME__ 입니다.');
  console.log('');
  console.log('  \x1b[36m▸ app-starter template 자체에서 실행하셨다면\x1b[0m');
  console.log('     파생 레포를 먼저 만드세요:');
  console.log('');
  console.log('     \x1b[2mgh repo create ukkiee-dev/my-app \\\x1b[0m');
  console.log('     \x1b[2m  --template ukkiee-dev/app-starter --clone\x1b[0m');
  console.log('     \x1b[2mcd my-app\x1b[0m');
  console.log('     \x1b[2mpnpm run setup && pnpm install\x1b[0m');
  console.log('     \x1b[2mpnpm service:add\x1b[0m');
  console.log('');
  console.log('  \x1b[36m▸ 파생 레포에서 setup을 건너뛰셨다면\x1b[0m');
  console.log('     \x1b[2mpnpm run setup\x1b[0m');
  console.log('');
  console.log('  \x1b[36m▸ template 자체를 테스트해보고 싶다면\x1b[0m');
  console.log('     \x1b[2mpnpm test:sandbox\x1b[0m  (대화형 UI 체험)');
  console.log('     \x1b[2mpnpm test:gen\x1b[0m      (3 type 일괄 검증)');
  console.log('');
  process.exit(1);
}

// ── 대화형 prompt ────────────────────────────────────────────
intro('🚀 서비스 추가');

const nameRe = /^[a-z][a-z0-9-]*[a-z0-9]$/;

if (!serviceName) {
  const value = await text({
    message: '서비스 이름',
    placeholder: 'api / web / scraper',
    validate(input: string) {
      if (!input) return '필수';
      if (!nameRe.test(input)) return 'RFC 1123 형식 (소문자/숫자/하이픈, 2자 이상)';
      if (input.length > 40) return '40자 이하';
      return;
    },
  });
  if (isCancel(value)) {
    cancel('취소됨');
    process.exit(1);
  }
  serviceName = value;
}

if (!nameRe.test(serviceName) || serviceName.length > 40) {
  console.error(`::error::service-name 형식 오류: '${serviceName}'`);
  process.exit(1);
}

if (!type) {
  const value = await select<ServiceType>({
    message: '타입',
    options: [
      { value: 'web', label: 'web', hint: 'HTTP API' },
      { value: 'static', label: 'static', hint: 'SPA (Caddy + 런타임 env 주입)' },
      { value: 'worker', label: 'worker', hint: '백그라운드 워커 (HTTP 노출 없음)' },
    ],
  });
  if (isCancel(value)) {
    cancel('취소됨');
    process.exit(1);
  }
  type = value;
}

// ── framework 결정 (type별 옵션) ─────────────────────────────
const supported = FRAMEWORKS_BY_TYPE[type] as readonly string[];

if (supported.length > 0) {
  if (framework) {
    // 인자로 지정 — 유효성 검증
    if (!supported.includes(framework)) {
      console.error(
        `::error::type=${type} 은 framework '${framework}' 미지원 (options: ${supported.join(' | ')})`,
      );
      process.exit(1);
    }
  } else if (supported.length === 1) {
    // 옵션 1개면 자동 선택 + 알림
    framework = supported[0] as Framework;
    log.info(`프레임워크: ${framework} (기본)`);
  } else {
    const value = await select<Framework>({
      message: '프레임워크',
      options: supported.map((fw) => ({ value: fw as Framework, label: fw })),
    });
    if (isCancel(value)) {
      cancel('취소됨');
      process.exit(1);
    }
    framework = value;
  }
}

// ── 대상 경로 (framework 레이어 포함) ────────────────────────
const templateDir = framework
  ? join(SCRIPT_DIR, 'templates', type, framework)
  : join(SCRIPT_DIR, 'templates', type);
const serviceDir = join(ROOT_DIR, 'services', serviceName);

if (!existsSync(templateDir)) {
  console.error(`::error::템플릿이 없습니다: ${templateDir}`);
  process.exit(1);
}

if (existsSync(serviceDir)) {
  console.error(`::error::이미 존재하는 서비스: ${serviceDir}`);
  process.exit(1);
}

// ── 재귀 복사 + 치환 ─────────────────────────────────────────
async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

log.step('템플릿 복사 중...');

const files = await walk(templateDir);
for (const src of files) {
  const rel = relative(templateDir, src);
  const dst = join(serviceDir, rel);
  await mkdir(dirname(dst), { recursive: true });

  const raw = await readFile(src, 'utf8');
  const content = raw
    .replaceAll('{{APP_NAME}}', appName)
    .replaceAll('{{SERVICE_NAME}}', serviceName);
  await writeFile(dst, content);

  // docker-entrypoint.sh 는 실행 권한
  if (rel === 'docker-entrypoint.sh') {
    await chmod(dst, 0o755);
  }
}

outro(`✅ services/${serviceName} 생성 완료 (type=${type}${framework ? `, framework=${framework}` : ''})`);

// ── homelab 프로비저닝 안내 ──────────────────────────────────
// 이 레포의 create-app.yml (workflow_dispatch caller) 을 호출해야 한다.
// homelab 의 _create-app.yml 은 reusable (workflow_call) 이라 직접 dispatch 불가.
// caller 의 read-config job 이 services/<svc>/.app-config.yml 을 읽어 전달한다.
console.log('── homelab 프로비저닝 (이 서비스에 대해 최초 1회) ──');
if (type === 'worker') {
  console.log(`  gh workflow run create-app.yml \\`);
  console.log(`    -f service-name=${serviceName}`);
  console.log(`  # subdomain 비움 → homelab이 worker 매니페스트(Deployment만) 자동 생성`);
} else {
  console.log(`  gh workflow run create-app.yml \\`);
  console.log(`    -f service-name=${serviceName} \\`);
  console.log(`    -f subdomain=${serviceName}    # 필요한 서브도메인으로 변경`);
}
