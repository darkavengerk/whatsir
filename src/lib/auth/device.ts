import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 디바이스 토큰.
 *
 * 목적: 로그인 절차 없이도 "이 기기 = 이 사용자"를 서버가 기억한다.
 * 구현:
 *   1. 가입 완료 직후 서버가 랜덤한 긴 토큰을 발급.
 *   2. 토큰 해시(sha256)만 `devices` 테이블에 저장.
 *   3. raw 토큰은 HttpOnly, Secure, SameSite=Lax 쿠키로 응답.
 *   4. 이후 요청마다 쿠키의 토큰을 해시해서 조회 → user_id 획득.
 *
 * 주의:
 *   - 브라우저 수준 fingerprint이지 OS 단말기 번호가 아니다. 쿠키 지우면 분실.
 *   - 복구 수단: 이메일 OTP로 다시 로그인 후 새 디바이스 등록.
 *   - Supabase 세션과는 독립. 세션 만료 시 exchange 엔드포인트에서
 *     admin API로 새 세션을 굽는 용도로 사용할 수 있음.
 *   - service role 키가 없으면 admin 조회가 불가. registerDevice는 에러를 던지고
 *     resolveDevice는 조용히 null을 돌려준다.
 */

export const DEVICE_COOKIE = "whatsir.device";
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 새 디바이스 등록.
 * 가입 직후 또는 "이 기기 기억하기" 선택 시 호출.
 * 호출자는 Server Action 또는 Route Handler여야 한다 (cookies 쓰기 필요).
 */
export async function registerDevice(params: {
  userId: string;
  label?: string;
  userAgent?: string;
}): Promise<{ token: string; deviceId: string }> {
  const admin = await createAdminClient();
  if (!admin) {
    throw new Error("Supabase service role key가 필요해. /settings에서 입력해줘.");
  }

  const token = randomToken();
  const tokenHash = await sha256Hex(token);

  const { data, error } = await admin
    .from("devices")
    .insert({
      user_id: params.userId,
      token_hash: tokenHash,
      label: params.label,
      user_agent: params.userAgent,
      last_seen_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`device register failed: ${error?.message ?? "unknown"}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });

  return { token, deviceId: (data as { id: string }).id };
}

/**
 * 현재 요청의 디바이스 쿠키를 검증하고 user_id를 돌려준다.
 * 토큰이 유효하지 않거나 revoke 되어 있으면 null.
 */
export async function resolveDevice(): Promise<{ userId: string; deviceId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEVICE_COOKIE)?.value;
  if (!token) return null;

  const admin = await createAdminClient();
  if (!admin) return null;

  const tokenHash = await sha256Hex(token);
  const { data } = await admin
    .from("devices")
    .select("id, user_id, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!data || (data as { revoked_at: string | null }).revoked_at) return null;

  // last_seen 업데이트 — 실패해도 흐름은 진행.
  void admin
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", (data as { id: string }).id);

  return {
    userId: (data as { user_id: string }).user_id,
    deviceId: (data as { id: string }).id,
  };
}

/**
 * 현재 디바이스를 revoke한다(=로그아웃).
 */
export async function revokeCurrentDevice(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEVICE_COOKIE)?.value;
  cookieStore.delete(DEVICE_COOKIE);
  if (!token) return;

  const admin = await createAdminClient();
  if (!admin) return;

  const tokenHash = await sha256Hex(token);
  await admin
    .from("devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
}
