import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDevice } from "@/lib/auth/device";

/**
 * 인증이 필요한 영역의 가드.
 * - Supabase 미설정 → /settings
 * - 세션 없음 + 디바이스 쿠키 있음 → /auth/refresh (디바이스 기반 세션 복구 시도)
 * - 세션 없음 + 디바이스 쿠키 없음 → /login
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) redirect("/settings");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const device = await resolveDevice();
    if (device) redirect("/auth/refresh");
    redirect("/login");
  }

  return <div className="flex flex-1 flex-col">{children}</div>;
}
