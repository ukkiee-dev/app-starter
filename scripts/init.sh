#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${1:-}"
if [ -z "$APP_NAME" ]; then
  APP_NAME="$(git config --get remote.origin.url 2>/dev/null \
    | sed -E 's|.*/([^/]+)\.git$|\1|; s|.*/([^/]+)$|\1|' || true)"
fi
if [ -z "$APP_NAME" ]; then
  APP_NAME="$(basename "$(pwd)")"
fi

if [[ ! "$APP_NAME" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]] || [ ${#APP_NAME} -gt 63 ]; then
  echo "::error::app-name 형식 오류: '$APP_NAME' (RFC 1123, 소문자/숫자/하이픈, 63자 이하)" >&2
  exit 1
fi

if [ "$APP_NAME" = "app-starter" ]; then
  echo "::error::app-starter는 template 이름입니다. 파생 레포에서 실행하세요." >&2
  exit 1
fi

CURRENT_NAME="$(node -p "require('./package.json').name" 2>/dev/null || true)"
if [ -n "$CURRENT_NAME" ] && [ "$CURRENT_NAME" != "__APP_NAME__" ]; then
  echo "⚠️  이미 초기화됨: package.json name = $CURRENT_NAME"
  exit 0
fi

echo "앱 이름: $APP_NAME"
echo "계속하려면 Enter, 취소는 Ctrl+C"
read -r

# macOS와 GNU sed의 in-place 옵션이 다르다.
if [ "$(uname -s)" = "Darwin" ]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

# templates/ 와 scripts/ 는 generator가 계속 사용하므로 치환하지 않는다.
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
