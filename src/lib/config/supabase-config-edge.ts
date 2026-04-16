/**
 * Edge runtime(미들웨어) 안전 버전.
 *
 * 미들웨어는 기본적으로 Edge에서 돌아 fs / process.cwd를 쓸 수 없다.
 * 따라서 여기서는 환경변수만 확인한다. 파일 기반 설정은 미들웨어에서
 * 세션 갱신에 쓰이지 않더라도 Server Component에서는 정상 동작한다.
 */

export type EdgeSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function readSupabaseConfigFromEnv(): EdgeSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
