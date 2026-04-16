import { NextResponse } from "next/server";
import { readSupabaseConfig } from "@/lib/config/supabase-config";

/**
 * 브라우저가 Supabase 클라이언트를 생성하는 데 필요한 public 값만 노출.
 * service role은 절대 여기로 내보내지 않는다.
 */
export async function GET() {
  const config = await readSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { configured: false },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      configured: true,
      url: config.url,
      anonKey: config.anonKey,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
