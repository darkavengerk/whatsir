import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { resolveDevice } from "@/lib/auth/device";

/**
 * QR 체크인 페이지.
 *
 * 비로그인 상태에서도 접근 가능. 실제 흐름:
 *
 *   1. URL의 token 으로 activities.check_in_token 조회 (admin client 사용, 만료 확인).
 *   2. 디바이스 쿠키가 있으면 → 해당 user_id로 attendance insert, 끝.
 *   3. 없으면 → 가입 플로우로 이동 (return_to 파라미터로 돌아올 주소 보존).
 */
export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = await createAdminClient();
  if (!admin) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-xl font-bold">아직 준비되지 않았어요</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          서버가 아직 Supabase에 연결되지 않았거나 service role 키가 없어서 체크인을 처리할 수 없어.
          주최자에게 알려주세요.
        </p>
        <Link href="/settings" className="mt-4 text-xs text-neutral-400 underline">
          관리자인가요? 설정
        </Link>
      </main>
    );
  }

  const { data: activity } = await admin
    .from("activities")
    .select("id, meeting_id, title, starts_at, check_in_token_expires_at")
    .eq("check_in_token", token)
    .maybeSingle();

  if (!activity) notFound();

  const row = activity as {
    id: string;
    meeting_id: string;
    title: string | null;
    starts_at: string;
    check_in_token_expires_at: string | null;
  };
  if (row.check_in_token_expires_at && new Date(row.check_in_token_expires_at) < new Date()) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div>
          <h1 className="text-xl font-bold">만료된 QR</h1>
          <p className="mt-2 text-sm text-neutral-500">
            이 출석 링크는 더 이상 유효하지 않아요. 주최자에게 새 링크를 받아 다시 시도하세요.
          </p>
        </div>
      </main>
    );
  }

  // 디바이스 쿠키로 기존 사용자 인식 시도.
  const device = await resolveDevice();

  if (device) {
    // Supabase 세션이 없는 경우(쿠키만 있음)도 admin 클라이언트로 attendance insert 가능.
    await admin.from("attendances").upsert(
      { activity_id: row.id, user_id: device.userId },
      { onConflict: "activity_id,user_id" },
    );

    // 로그인 상태라면 활동 페이지로, 아니면 공개 랜딩 확인 페이지로.
    const supabase = await createClient();
    const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

    if (data.user) {
      redirect(`/meetings/${row.meeting_id}/activities/${row.id}`);
    }

    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">체크인 완료</h1>
        <p className="mt-2 text-sm text-neutral-500">{row.title ?? "회차"}에 출석으로 기록했어요.</p>
      </main>
    );
  }

  // 가입 플로우로.
  redirect(`/signup?return_to=${encodeURIComponent(`/check-in/${token}`)}`);
}
