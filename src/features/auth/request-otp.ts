import type { Result } from "./signup";

/**
 * 이 모듈이 필요로 하는 최소 인증 인터페이스.
 * Supabase SupabaseClient["auth"]가 이 shape를 충족한다.
 * 테스트에서는 이 shape만 mock하면 된다.
 */
export type OtpCapableAuth = {
  signInWithOtp: (params: {
    email: string;
    options?: {
      shouldCreateUser?: boolean;
      data?: Record<string, unknown>;
    };
  }) => Promise<{ error: { message: string } | null }>;
};

export type OtpError = { message: string };

/**
 * 가입용 OTP 메일 발송.
 * 이름은 `raw_user_meta_data.display_name` 에 담겨 나중에 verify 단계에서 프로필 생성 시 사용된다.
 */
export async function requestSignupOtp(
  deps: { auth: OtpCapableAuth },
  input: { email: string; name: string },
): Promise<Result<{ email: string }, OtpError>> {
  const { error } = await deps.auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: true,
      data: { display_name: input.name },
    },
  });

  if (error) {
    return { ok: false, error: { message: error.message } };
  }
  return { ok: true, value: { email: input.email } };
}
