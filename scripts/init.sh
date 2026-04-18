#!/usr/bin/env bash
#
# 레포 초기화 — __APP_NAME__ placeholder를 실제 레포 이름으로 치환한다.
#
# Usage:
#   ./scripts/init.sh               # git remote에서 자동 감지
#   ./scripts/init.sh <app-name>    # 명시 지정
#
set -euo pipefail

# ── app-name 결정 ────────────────────────────────────────────
APP_NAME="${1:-}"
if [ -z "$APP_NAME" ]; then
  APP_NAME="$(git config --get remote.origin.url 2>/dev/null \
    | sed -E 's|.*/([^/]+)\.git$|\1|; s|.*/([^/]+)$|\1|' || true)"
fi
if [ -z "$APP_NAME" ]; then
  APP_NAME="$(basename "$(pwd)")"
fi

# ── 유효성 검사 ──────────────────────────────────────────────
if [[ ! "$APP_NAME" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]] || [ ${#APP_NAME} -gt 63 ]; then
  echo "::error::app-name 형식 오류: '$APP_NAME' (RFC 1123, 소문자/숫자/하이픈, 63자 이하)" >&2
  exit 1
fi

if [ "$APP_NAME" = "app-starter" ]; then
  echo "::error::app-starter는 template 이름입니다. 파생 레포에서 실행하세요." >&2
  exit 1
fi

# ── 이미 초기화되었는지 ─────────────────────────────────────
CURRENT_NAME="$(node -p "require('./package.json').name" 2>/dev/null || true)"
if [ -n "$CURRENT_NAME" ] && [ "$CURRENT_NAME" != "__APP_NAME__" ]; then
  echo "⚠️  이미 초기화됨: package.json name = $CURRENT_NAME"
  exit 0
fi

echo "앱 이름: $APP_NAME"
echo "계속하려면 Enter, 취소는 Ctrl+C"
read -r

# ── placeholder 치환 ────────────────────────────────────────
# templates/ 와 scripts/ 는 건드리지 않는다 (향후 add-service에서 사용).
# sed 호환성: macOS는 -i '', Linux/WSL은 -i
if [ "$(uname -s)" = "Darwin" ]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

while IFS= read -r -d '' f; do
  "${SED_INPLACE[@]}" "s/__APP_NAME__/$APP_NAME/g" "$f"
done < <(find . -type f \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  -not -path './scripts/*' \
  -print0)

echo ""
echo "✅ $APP_NAME 로 초기화 완료"
echo ""
echo "다음 단계:"
echo "  1) pnpm install           # 의존성 설치 (@clack/prompts 포함)"
echo "  2) pnpm service:add       # 대화형 서비스 추가 (화살표 UI)"
echo ""
echo "또는 한 번에 인자로:"
echo "  pnpm service:add api --type web"
