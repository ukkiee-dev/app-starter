/**
 * 애플리케이션 환경변수 — Vite 빌드 타임에 인라인.
 *
 * - dev (`vite dev`): .env / .env.local 의 VITE_* 로드
 * - prod (빌드): vite build 시점에 VITE_* 값이 번들에 하드코딩
 *
 * 환경별 값 교체는 **이미지를 다시 빌드**해서 처리 (homelab 단일 환경 기준).
 *
 * 새 키 추가: vite-env.d.ts 에 타입 → .env.example 에 기본값 → 아래 객체에 엔트리 추가.
 */
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? '',
  FEATURE_FLAGS: import.meta.env.VITE_FEATURE_FLAGS ?? '',
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN ?? '',
} as const;
