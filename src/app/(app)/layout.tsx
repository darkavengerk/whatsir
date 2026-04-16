import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 인증이 필요한 영역의 가드.
 * - Supabase 미설정 → /settings
 * - 세션 없음 → /login
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
  if (!user) redirect("/login");

  return <div className="flex flex-1 flex-col">{children}</div>;
}
