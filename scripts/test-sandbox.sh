#!/usr/bin/env bash
#
# 대화형 샌드박스 — 임시 디렉토리에 template 복제 후 init+install 완료한 상태로
# 사용자를 서브셸에 진입시킨다. pnpm service:add 의 clack UI 등을 실제로 체험 가능.
#
# Usage:
#   pnpm test:sandbox
#
# 종료:
#   샌드박스 안에서 'exit' 하면 돌아옴. 자동 정리 여부 prompt.
#
set -euo pipefail

STARTER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMPDIR="$(mktemp -d -t app-starter-sandbox.XXXXXX)"

echo ""
echo "▶ 샌드박스 준비: $TMPDIR"
cp -R "$STARTER_DIR/." "$TMPDIR/"
rm -rf "$TMPDIR/node_modules" 2>/dev/null || true
cd "$TMPDIR"

echo "▶ scripts/init.sh (name = sample-app)"
echo "" | ./scripts/init.sh sample-app >/dev/null

echo "▶ pnpm install"
pnpm install --silent

echo ""
echo "──────────────────────────────────────────────────────"
echo "✅ 샌드박스 준비 완료"
echo ""
echo "   현재 위치: $TMPDIR"
echo ""
echo "   시험해볼 명령 (대화형 UI 체험):"
echo "     pnpm service:add               # 화살표 선택"
echo "     pnpm service:add api           # 이름만 주고 type prompt"
echo "     pnpm service:add web --type static   # 인자 모드"
echo ""
echo "   'exit' 를 입력하면 샌드박스에서 나갑니다."
echo "──────────────────────────────────────────────────────"
echo ""

# 서브셸 진입 — 사용자가 자유롭게 명령 실행
# APP_STARTER_SANDBOX 환경변수로 PS1 꾸미기는 쉘 RC에 의존. 생략하고 경로만 안내.
(
  cd "$TMPDIR"
  "${SHELL:-bash}" -i
) || true

rm -rf "$TMPDIR"
echo ""
echo "   🗑️  샌드박스 자동 정리: $TMPDIR"
