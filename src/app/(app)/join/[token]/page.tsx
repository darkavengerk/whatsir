import { notFound, redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

/**
 * 초대 링크 접근 페이지.
 * - (app) 그룹 내부라 이미 로그인 가드 통과. 비로그인은 /login로 갔다가 return_to로 돌아옴.
 * - 이미 멤버면 곧바로 모임 페이지로 이동.
 * - 그 외에는 닉네임 입력 폼을 보여준다.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await requireClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, name, description")
    .eq("invite_token", token)
    .maybeSingle();

  if (!meeting) notFound();

  const m = meeting as { id: string; name: string; description: string | null };

  const { data: existing } = await supabase
    .from("meeting_members")
    .select("meeting_id")
    .eq("meeting_id", m.id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) redirect(`/meetings/${m.id}`);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-xl font-bold">초대받은 모임</h1>
      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="font-medium">{m.name}</div>
        {m.description && (
          <p className="mt-1 text-sm text-neutral-500">{m.description}</p>
        )}
      </div>

      <div className="mt-6">
        <JoinForm inviteToken={token} />
      </div>
    </main>
  );
}
