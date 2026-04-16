import { SignupForm } from "./signup-form";

/**
 * 가입 페이지.
 * 1단계: 이름 + 이메일 → OTP 메일 발송
 * 2단계: OTP 입력 → 프로필 생성 + 디바이스 등록 → /meetings 또는 return_to
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">가입하기</h1>
        <p className="mt-2 text-sm text-neutral-500">
          이메일로 6자리 코드와 링크를 보내. 코드를 입력하거나 링크를 클릭하면 돼.
          가입 후에는 이 기기에서 자동 로그인되게 기록할게.
        </p>
        <div className="mt-8">
          <SignupForm returnTo={return_to} />
        </div>
      </div>
    </main>
  );
}
