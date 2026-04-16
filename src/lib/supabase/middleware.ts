import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { readSupabaseConfigFromEnv } from "@/lib/config/supabase-config-edge";

/**
 * 미들웨어에서 세션 쿠키를 갱신한다.
 *
 * Edge runtime이라 파일 기반 설정은 여기서 못 읽는다 — 환경변수만 본다.
 * 개발 환경에서 /settings 폼으로만 설정한 경우에는 middleware가 세션을
 * 갱신하지 않지만, Server Component 레벨에서 파일 기반 설정을 읽어
 * 동작은 유지된다. (프로덕션에선 반드시 env 경로.)
 */
export async function updateSession(request: NextRequest) {
  const config = readSupabaseConfigFromEnv();
  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
