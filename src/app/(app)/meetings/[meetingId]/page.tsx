import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { resolveTerminology, type Terminology } from "@/types/domain";
import { InviteLinkBox } from "./invite-link-box";

/**
 * 모임 홈. 활동 타임라인, 멤버, 주제(주제=게임/책)를 한 화면에 요약.
 * terminology가 적용되어 같은 컴포넌트에서 "활동"/"모임 회차"/"세션" 등
 * 라벨만 바뀐다.
 */
export default async function MeetingHomePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const supabase = await requireClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, name, description, terminology, invite_token")
    .eq("id", meetingId)
    .single();

  if (!meeting) notFound();

  const term = resolveTerminology(
    (meeting as { terminology: Terminology | null }).terminology,
  );

  const [{ data: activities }, { data: topics }, { count: memberCount }] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, starts_at")
      .eq("meeting_id", meetingId)
      .order("starts_at", { ascending: false })
      .limit(10),
    supabase
      .from("topics")
      .select("id, title")
      .eq("meeting_id", meetingId)
      .limit(20),
    supabase
      .from("meeting_members")
      .select("*", { count: "exact", head: true })
      .eq("meeting_id", meetingId),
  ]);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold">{(meeting as { name: string }).name}</h1>
        {(meeting as { description: string | null }).description && (
          <p className="mt-2 text-sm text-neutral-500">
            {(meeting as { description: string | null }).description}
          </p>
        )}
        <dl className="mt-4 flex gap-6 text-sm text-neutral-500">
          <div>
            <dt>{term.members}</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">{memberCount ?? 0}</dd>
          </div>
          <div>
            <dt>{term.topics}</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">
              {topics?.length ?? 0}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{term.activities}</h2>
          <Link
            href={`/meetings/${meetingId}/activities/new`}
            className="text-sm text-blue-600"
          >
            + 새 {term.activity}
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {(activities ?? []).map((a) => {
            const row = a as { id: string; title: string | null; starts_at: string };
            return (
              <li key={row.id}>
                <Link
                  href={`/meetings/${meetingId}/activities/${row.id}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
                >
                  <span>{row.title ?? new Date(row.starts_at).toLocaleString("ko-KR")}</span>
                  <span className="text-neutral-500">
                    {new Date(row.starts_at).toLocaleDateString("ko-KR")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {(meeting as { invite_token: string | null }).invite_token && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-500">초대 링크</h2>
          <p className="mt-1 text-xs text-neutral-500">
            이 링크를 공유하면 다른 사람이 이 모임에 가입할 수 있어.
          </p>
          <div className="mt-2">
            <InviteLinkBox
              token={(meeting as { invite_token: string }).invite_token}
            />
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{term.topics}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(topics ?? []).map((t) => {
            const row = t as { id: string; title: string };
            return (
              <li
                key={row.id}
                className="rounded-full border border-neutral-200 px-3 py-1 text-sm dark:border-neutral-800"
              >
                {row.title}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10">
        <Link
          href={`/graph/${meetingId}`}
          className="text-sm text-neutral-500 underline underline-offset-4"
        >
          데스크톱에서 그래프로 탐색하기 →
        </Link>
      </div>
    </main>
  );
}
