export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type SignupInput = {
  name: string;
  email: string;
};

export type FieldError = {
  field: "name" | "email";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 가입 폼 입력을 정규화 + 검증한다.
 * - 이름: trim 후 1~50자
 * - 이메일: trim + lowercase, @ 포함 형태
 */
export function validateSignupInput(raw: SignupInput): Result<SignupInput, FieldError> {
  const name = raw.name.trim();
  const email = raw.email.trim().toLowerCase();

  if (name.length === 0) {
    return { ok: false, error: { field: "name", message: "이름을 입력해줘." } };
  }
  if (name.length > 50) {
    return { ok: false, error: { field: "name", message: "이름은 50자까지 가능해." } };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: { field: "email", message: "이메일 형식이 올바르지 않아." } };
  }

  return { ok: true, value: { name, email } };
}
