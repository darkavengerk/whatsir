import type { Result } from "./signup";
import type { VerifyOtpCapable } from "./verify-otp";

/**
 * 로그인 OTP 검증. signup과 달리 profile은 이미 존재한다고 가정하므로 upsert 안 한다.
 */
export async function verifyLoginOtp(
  deps: { auth: VerifyOtpCapable },
  input: { email: string; token: string },
): Promise<Result<{ userId: string }, { message: string }>> {
  const { data, error } = await deps.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: "email",
  });

  if (error || !data.user) {
    return { ok: false, error: { message: error?.message ?? "OTP 검증에 실패했어." } };
  }

  return { ok: true, value: { userId: data.user.id } };
}
