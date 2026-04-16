import { resolveDisplayName } from "./display-name";
import type { Result } from "./signup";

export type VerifyOtpCapable = {
  verifyOtp: (params: {
    email: string;
    token: string;
    type: "email";
  }) => Promise<{
    data: {
      user: {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      } | null;
    };
    error: { message: string } | null;
  }>;
};

export type UpsertProfile = (profile: {
  id: string;
  displayName: string;
  email: string;
}) => Promise<{ error: { message: string } | null }>;

export type VerifyOtpDeps = {
  auth: VerifyOtpCapable;
  upsertProfile: UpsertProfile;
};

export type VerifyOtpError = { message: string };
export type VerifyOtpValue = { userId: string; displayName: string };

/**
 * OTP 숫자 코드를 검증하고, 성공 시 profiles에 upsert한다.
 * display_name은 signInWithOtp 때 user_metadata에 실어 보낸 값을 쓴다.
 * 메타데이터가 비어있으면 이메일의 local-part를 fallback으로 쓴다.
 */
export async function verifySignupOtp(
  deps: VerifyOtpDeps,
  input: { email: string; token: string },
): Promise<Result<VerifyOtpValue, VerifyOtpError>> {
  const { data, error } = await deps.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: "email",
  });

  if (error || !data.user) {
    return { ok: false, error: { message: error?.message ?? "OTP 검증에 실패했어." } };
  }

  const user = data.user;
  const resolved = resolveDisplayName({
    email: user.email ?? input.email,
    metadata: user.user_metadata,
  });
  const displayName = resolved.length > 0 ? resolved : input.email.split("@")[0];

  const upsert = await deps.upsertProfile({
    id: user.id,
    displayName,
    email: input.email,
  });

  if (upsert.error) {
    return { ok: false, error: { message: upsert.error.message } };
  }

  return { ok: true, value: { userId: user.id, displayName } };
}
