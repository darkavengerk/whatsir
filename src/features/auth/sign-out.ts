export type SignOutDeps = {
  auth: { signOut: () => Promise<{ error: { message: string } | null }> };
  revokeDevice: () => Promise<void>;
};

/**
 * 로그아웃. Supabase 세션 종료 + 디바이스 쿠키 revoke를 순서대로.
 * Supabase쪽 에러가 나도 디바이스는 반드시 revoke한다 (권한 바깥으로 노출 방지).
 */
export async function performSignOut(deps: SignOutDeps): Promise<{ ok: true }> {
  await deps.auth.signOut().catch(() => {
    // 네트워크 실패해도 로컬 쿠키는 이어서 정리.
  });
  await deps.revokeDevice();
  return { ok: true };
}
