"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * 브라우저에서 사용하는 Supabase 클라이언트 팩토리.
 *
 * 서버에서 NEXT_PUBLIC_ 환경변수가 빌드타임에 주입되면 그걸 쓰고,
 * 파일 기반 설정을 사용하는 경우에는 SupabaseBrowserProvider가
 * 런타임에 받아온 값을 직접 넘겨준다.
 */
export function createClient(
  url?: string,
  anonKey?: string,
): SupabaseClient<Database> | null {
  const resolvedUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resolvedKey = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!resolvedUrl || !resolvedKey) return null;
  return createBrowserClient<Database>(resolvedUrl, resolvedKey);
}
