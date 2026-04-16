import type { OtpCapableAuth, OtpError } from "./request-otp";
import type { Result } from "./signup";

/**
 * 로그인용 OTP 발송. 신규 유저 생성 금지.
 * Supabase가 "Signups not allowed" 류 메시지를 돌려주면 가입 안내로 변환한다.
 */
export async function requestLoginOtp(
  deps: { auth: OtpCapableAuth },
  input: { email: string },
): Promise<Result<{ email: string }, OtpError>> {
  const { error } = await deps.auth.signInWithOtp({
    email: input.email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    const msg = /Signups? not allowed/i.test(error.message)
      ? "가입된 계정이 없어. 먼저 가입하거나 이메일 주소를 확인해줘."
      : error.message;
    return { ok: false, error: { message: msg } };
  }
  return { ok: true, value: { email: input.email } };
}
