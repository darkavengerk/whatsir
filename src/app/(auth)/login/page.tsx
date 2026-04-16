/**
 * 로그인 페이지 (MVP 스텁).
 *
 * 플로우:
 *   - 이미 디바이스 쿠키가 있으면 middleware가 세션을 복구하여 여기 안 옴.
 *   - 복구(=새 기기) 상황에서만 이 페이지가 의미 있음.
 *   - 이메일 OTP로 한 번 통과하면 다시 디바이스 등록.
 */
export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-neutral-500">
          다른 기기에서 로그인 중이신가요? 가입할 때 쓴 이메일로 코드를 받아 이 기기를 연결하세요.
        </p>
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
          스텁. 이메일 OTP + 디바이스 재등록 구현 예정.
        </div>
      </div>
    </main>
  );
}
