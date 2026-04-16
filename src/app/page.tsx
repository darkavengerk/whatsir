import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * 랜딩 페이지. 로그인 된 사용자는 /meetings 로 보내고,
 * 비인증 사용자에게는 간단한 소개와 가입/로그인 버튼만.
 * QR 체크인 링크로 접근하는 경우는 /check-in/[token] 이 처리.
 */
export default async function Home() {
  const supabase = await createClient();
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
    </main>
  );
}
