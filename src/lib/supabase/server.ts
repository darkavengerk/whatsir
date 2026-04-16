import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { readSupabaseConfig } from "@/lib/config/supabase-config";

/**
 * Server Component / Server Action / Route Handler 용 Supabase 클라이언트.
 *
 * 설정이 비어 있으면 null — 호출자가 /settings 로 리디렉트하거나
 * 설정 필요 UI를 표시해야 한다.
 */
export async function createClient(): Promise<SupabaseClient<Database> | null> {
  const config = await readSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
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
          // Server Component에서는 set 불가. middleware가 갱신.
        }
      },
    },
  });
}

/**
 * 미설정이면 /settings로 리디렉트하고, 아니면 non-null 클라이언트를 반환.
 * Server Component 내부에서 흐름을 단순화하는 헬퍼.
 */
export async function requireClient(): Promise<SupabaseClient<Database>> {
  const client = await createClient();
  if (!client) redirect("/settings");
  return client;
}

/**
 * Service role 키를 사용하는 관리자 클라이언트. RLS를 우회한다.
 * service role이 아직 입력되지 않았으면 null.
 */
export async function createAdminClient(): Promise<SupabaseClient<Database> | null> {
  const config = await readSupabaseConfig();
  if (!config || !config.serviceRoleKey) return null;

  return createServiceClient<Database>(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
