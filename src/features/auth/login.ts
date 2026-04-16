import type { FieldError, Result } from "./signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginInput = { email: string };

/**
 * 로그인 폼 입력을 정규화 + 검증한다. 로그인은 이메일만 필요.
 * (이메일 정규화 규칙은 signup과 동일해야 하지만, 재사용 수요가 적어 일단 지역화.
 *  세 번째 사용처가 생기면 공용 유틸로 승격.)
 */
export function validateLoginInput(raw: LoginInput): Result<LoginInput, FieldError> {
  const email = raw.email.trim().toLowerCase();
  if (email.length === 0) {
    return { ok: false, error: { field: "email", message: "이메일을 입력해줘." } };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: { field: "email", message: "이메일 형식이 올바르지 않아." } };
  }
  return { ok: true, value: { email } };
}
