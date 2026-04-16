import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerDevice } from "@/lib/auth/device";
import { resolveDisplayName } from "@/features/auth/display-name";

/**
 * 이메일 링크 클릭 콜백.
 *
 * Supabase 이메일 템플릿에서 링크 URL이 다음 형태여야 한다:
 *   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/meetings
 *
 * 링크 클릭 시:
 *   1. token_hash로 OTP 검증 → Supabase 세션 쿠키 설정
 *   2. profiles 없으면 생성 (display_name은 user_metadata 또는 email local-part)
 *   3. device 등록 (자동 인식용)
 *   4. `next`로 리디렉트
 *
 * 이 엔드포인트와 /signup(or /login) 폼의 OTP 코드 입력은 병렬 UX — 둘 다 쓰임.
 */
export const runtime = "nodejs";

type OtpType = "email" | "signup" | "magiclink" | "recovery" | "invite" | "email_change";

const ALLOWED_TYPES: OtpType[] = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

function loginRedirect(request: NextRequest, reason: string) {
  const url = new URL(`/login`, request.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = (searchParams.get("type") ?? "email") as OtpType;
  const next = searchParams.get("next") || "/meetings";

  if (!tokenHash) return loginRedirect(request, "invalid_link");
  if (!ALLOWED_TYPES.includes(rawType)) return loginRedirect(request, "invalid_type");

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/settings", request.url));

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType,
  });

  if (error || !data.user) {
    return loginRedirect(request, error?.message ?? "link_expired");
  }

  const user = data.user;
  const email = user.email ?? "";
  const displayName = resolveDisplayName({ email, metadata: user.user_metadata });

  if (email && displayName.length > 0) {
    // 이미 프로필이 있으면 덮어쓰지 않는다 — 링크를 여러 번 클릭하거나
    // 로그인 중 들어오는 케이스에서 기존 정보 보존.
    await supabase.from("profiles").upsert(
      { id: user.id, display_name: displayName, email },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  try {
    await registerDevice({
      userId: user.id,
      label: "web",
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  } catch {
    // 디바이스 등록 실패는 로그인 자체를 막지 않는다.
  }

  return NextResponse.redirect(new URL(next, request.url));
}
