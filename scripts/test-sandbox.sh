#!/usr/bin/env bash
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

(
  cd "$TMPDIR"
  "${SHELL:-bash}" -i
) || true

rm -rf "$TMPDIR"
echo ""
echo "   🗑️  샌드박스 자동 정리: $TMPDIR"
