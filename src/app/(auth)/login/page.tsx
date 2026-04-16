import Link from "next/link";
import { LoginForm } from "./login-form";

const FRIENDLY: Record<string, string> = {
  invalid_link: "링크가 올바르지 않아.",
  invalid_type: "링크 형식이 맞지 않아.",
  link_expired: "링크가 만료됐어. 다시 로그인 시도해줘.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; error?: string }>;
}) {
  const { return_to, error } = await searchParams;
  const errorMessage = error ? (FRIENDLY[error] ?? error) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-neutral-500">
          가입한 이메일로 받은 인증 코드를 입력하거나, 메일의 링크를 클릭해도 돼.
        </p>
        {errorMessage && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
            {errorMessage}
          </div>
        )}
        <div className="mt-8">
          <LoginForm returnTo={return_to} />
        </div>
        <p className="mt-6 text-xs text-neutral-500">
          아직 가입 안 했어?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            가입하기
          </Link>
        </p>
      </div>
    </main>
  );
}
