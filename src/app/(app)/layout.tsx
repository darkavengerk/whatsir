import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 인증이 필요한 영역의 가드.
 * Supabase 세션이 없으면 /login 으로 리디렉트.
 * (디바이스 토큰 기반 세션 복구는 middleware에서 처리된다.)
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <div className="flex flex-1 flex-col">{children}</div>;
}
