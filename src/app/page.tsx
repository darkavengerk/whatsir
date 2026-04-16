import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * 랜딩 페이지.
 * Supabase 미설정 상태에서도 접근 가능하며, 그 경우 설정 CTA를 보여준다.
 */
export default async function Home() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">whatsir</h1>
        <p className="mt-4 max-w-md text-neutral-600 dark:text-neutral-400">
          서버가 아직 데이터베이스에 연결되지 않았어. 먼저 Supabase 설정을 입력해줘.
        </p>
        <Link
          href="/settings"
          className="mt-10 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          설정하러 가기
        </Link>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">whatsir</h1>
      <p className="mt-4 max-w-md text-neutral-600 dark:text-neutral-400">
        오프라인 모임의 사람, 활동, 기록을 이어주는 앱.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {user ? (
          <Link
            href="/meetings"
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            내 모임으로
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              가입하기
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium dark:border-neutral-700"
            >
              로그인
            </Link>
          </>
        )}
      </div>

      <Link
        href="/settings"
        className="mt-12 text-xs text-neutral-400 underline underline-offset-4"
      >
        설정
      </Link>
    </main>
  );
}
