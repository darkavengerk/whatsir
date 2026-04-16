import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-neutral-500">
          가입한 이메일로 6자리 코드를 받아 로그인해. 같은 기기에서는 자동으로 기억할게.
        </p>
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
