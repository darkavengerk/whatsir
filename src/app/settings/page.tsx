import Link from "next/link";
import { readSupabaseConfig } from "@/lib/config/supabase-config";
import { SupabaseConfigForm } from "./supabase-form";
import { resetSupabaseConfig } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Supabase 부트스트랩 설정 페이지.
 *
 * 보안 메모:
 *   - 이 페이지는 인증 없이 접근 가능(어차피 Supabase가 없으면 인증도 없음).
 *   - 프로덕션에선 환경변수 경로를 쓰고 이 페이지를 사용하지 말 것.
 *   - 로컬 개발 중에만 부트스트랩 도구로 사용.
 */
export default async function SettingsPage() {
  const config = await readSupabaseConfig();
  const configured = !!config;
  const lockedByEnv = config?.source === "env";

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">Supabase 설정</h1>
      <p className="mt-2 text-sm text-neutral-500">
        서버가 Supabase에 연결하려면 아래 3개 값이 필요해. 환경변수가 설정돼 있으면 그걸 쓰고,
        없으면 이 폼으로 입력한 값을 <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">.whatsir/supabase.json</code>{" "}
        에 저장해 사용한다.
      </p>

      <StatusBanner configured={configured} source={config?.source} />

      <section className="mt-8">
        <SupabaseConfigForm
          defaultUrl={config?.url}
          defaultAnonKey={config?.anonKey}
          defaultServiceRoleKey={config?.serviceRoleKey ?? undefined}
          locked={lockedByEnv}
        />
      </section>

      {configured && !lockedByEnv && (
        <form action={resetSupabaseConfig} className="mt-8">
          <button
            type="submit"
            className="text-sm text-red-600 underline underline-offset-4"
          >
            설정 파일 삭제 (초기화)
          </button>
        </form>
      )}

      <section className="mt-12 space-y-3 text-sm text-neutral-500">
        <h2 className="font-semibold text-neutral-700 dark:text-neutral-300">참고</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Service role 키는 RLS를 우회하므로 <strong>절대 외부에 노출하지 마</strong>. 파일은 0600으로 저장되고 <code>.gitignore</code>에 포함돼 있어.
          </li>
          <li>
            Vercel 프로덕션 환경에선 파일 시스템이 읽기 전용이라 이 폼으로 저장이 안 돼. Vercel Project Settings → Environment Variables를 써.
          </li>
          <li>
            설정 완료 후 데이터베이스에 마이그레이션 적용: Supabase 대시보드 SQL Editor에서{" "}
            <code>supabase/migrations/0001_schema.sql</code>, <code>0002_rls.sql</code> 순으로 실행.
          </li>
        </ul>
      </section>

      <div className="mt-8">
        <Link href="/" className="text-sm text-neutral-500 underline underline-offset-4">
          ← 홈으로
        </Link>
      </div>
    </main>
  );
}

function StatusBanner({
  configured,
  source,
}: {
  configured: boolean;
  source?: "env" | "file";
}) {
  if (!configured) {
    return (
      <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        아직 설정되지 않았어. 값을 입력하고 저장하면 서버가 즉시 인식해.
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
      {source === "env" ? "환경변수" : "설정 파일"}로 연결돼 있어.
    </div>
  );
}
