import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveDevice } from "@/lib/auth/device";
import { refreshSessionFromDevice } from "@/features/auth/refresh-session";

/**
 * 만료된 Supabase 세션을 디바이스 쿠키로 복구.
 * (app) 가드가 `no session && device cookie` 상황에서 이쪽으로 리디렉트한다.
 *
 * 실패하면 /login 으로 튕기고, 성공하면 return_to 로.
 */
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to") || "/meetings";

  const admin = await createAdminClient();
  const supabase = await createClient();
  if (!admin || !supabase) {
    // service role 없음 → 복구 불가. 일반 로그인으로.
    return NextResponse.redirect(new URL(`/login?return_to=${encodeURIComponent(returnTo)}`, url));
  }

  const result = await refreshSessionFromDevice({
    resolveDevice: async () => {
      const d = await resolveDevice();
      return d ? { userId: d.userId } : null;
    },
    getUserEmail: async (userId) => {
      const { data } = await admin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      const row = data as { email: string | null } | null;
      return row?.email ?? null;
    },
    issueMagicLinkToken: async (email) => {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (error || !data?.properties?.hashed_token) {
        return { ok: false, error: error?.message ?? "generateLink empty" };
      }
      return { ok: true, hashedToken: data.properties.hashed_token };
    },
    verifyMagicLink: async ({ email, token }) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "magiclink",
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
  });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/login?return_to=${encodeURIComponent(returnTo)}`, url),
    );
  }

  return NextResponse.redirect(new URL(returnTo, url));
}
