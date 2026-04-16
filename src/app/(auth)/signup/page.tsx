/**
 * 가입 페이지 (MVP 스텁).
 *
 * 실제 플로우 (구현 예정):
 *   1. 이름 + 이메일 입력
 *   2. 이메일로 OTP 발송 (supabase.auth.signInWithOtp)
 *   3. OTP 검증 → auth.users 생성 + profiles insert
 *   4. registerDevice() 호출 → 디바이스 쿠키 발급
 *   5. /meetings 또는 원래 리디렉트 대상으로 이동
 */
export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">가입하기</h1>
        <p className="mt-2 text-sm text-neutral-500">
          이메일로 일회용 코드가 발송됩니다. 가입 후에는 이 기기에서 자동 로그인됩니다.
        </p>
        {/* TODO: 이메일/이름 입력 폼 + OTP 검증 단계 */}
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
          이 화면은 스텁입니다. Supabase auth + email OTP 구현 예정.
        </div>
      </div>
    </main>
  );
}
