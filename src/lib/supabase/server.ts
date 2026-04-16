import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server Component / Server Action / Route Handler에서 사용.
 * Next.js의 cookies() 를 읽어 세션을 유지한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component에서는 set이 불가. middleware에서 갱신되므로 무시.
          }
        },
      },
    },
  );
}

/**
 * Service role 키를 쓰는 관리자 클라이언트.
 * RLS를 우회하므로 신중하게 — QR 체크인 플로우처럼 익명 사용자를
 * 특정 user로 "주입"해야 하는 경우에만 Route Handler 내부에서 사용.
 */
export function createAdminClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
