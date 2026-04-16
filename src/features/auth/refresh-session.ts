import type { Result } from "./signup";

export type RefreshDeps = {
  /** 현재 요청의 디바이스 쿠키를 user로 해석. 없으면 null. */
  resolveDevice: () => Promise<{ userId: string } | null>;
  /** profiles에서 이메일 조회. */
  getUserEmail: (userId: string) => Promise<string | null>;
  /** Admin API로 magic link의 hashed token을 발급. */
  issueMagicLinkToken: (
    email: string,
  ) => Promise<{ ok: true; hashedToken: string } | { ok: false; error: string }>;
  /** Supabase client로 magic link를 검증 → 쿠키 세션 설정. */
  verifyMagicLink: (params: {
    email: string;
    token: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export type RefreshError = { message: string };
export type RefreshValue = { userId: string; email: string };

/**
 * 디바이스 쿠키를 이용해 만료된 Supabase 세션을 복구한다.
 * 파이프라인: resolveDevice → getUserEmail → issueMagicLinkToken → verifyMagicLink
 * 각 단계가 실패하면 조기 반환.
 */
export async function refreshSessionFromDevice(
  deps: RefreshDeps,
): Promise<Result<RefreshValue, RefreshError>> {
  const device = await deps.resolveDevice();
  if (!device) {
    return { ok: false, error: { message: "디바이스가 인식되지 않아." } };
  }

  const email = await deps.getUserEmail(device.userId);
  if (!email) {
    return { ok: false, error: { message: "프로필에 이메일이 없어." } };
  }

  const link = await deps.issueMagicLinkToken(email);
  if (!link.ok) {
    return { ok: false, error: { message: link.error } };
  }

  const verified = await deps.verifyMagicLink({ email, token: link.hashedToken });
  if (!verified.ok) {
    return { ok: false, error: { message: verified.error } };
  }

  return { ok: true, value: { userId: device.userId, email } };
}
