import { notFound } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { AddTopicForm } from "./add-topic-form";

/**
 * 활동 상세.
 * - 상단: 착석자 뷰 (처음 본 사람 파악용, 디스코드 멤버 리스트 패널 느낌)
 * - 중단: 주제/세부활동 리스트 + 추가 폼
 * - 하단: 사진/후기/채팅 (다음 단계)
 */
export default async function ActivityPage({
  params,
}: {
  params: Promise<{ meetingId: string; activityId: string }>;
}) {
  const { meetingId, activityId } = await params;
  const supabase = await requireClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("id, meeting_id, title, starts_at, location, description, check_in_token")
    .eq("id", activityId)
    .single();

  if (!activity) notFound();

  const [{ data: attendances }, { data: subtopics }] = await Promise.all([
    supabase
      .from("attendances")
      .select("seat_order, user:profiles(id, display_name, avatar_url)")
      .eq("activity_id", activityId)
      .order("seat_order", { ascending: true, nullsFirst: false }),
    supabase
      .from("activity_subtopics")
      .select("subtopic:subtopics(id, title, created_at)")
      .eq("activity_id", activityId),
  ]);

  const row = activity as {
    title: string | null;
    starts_at: string;
    location: string | null;
    description: string | null;
    check_in_token: string | null;
  };

  type Subtopic = { id: string; title: string; created_at: string };
  const subtopicRows: Subtopic[] = (subtopics ?? []).flatMap((r) => {
    const s = (r as { subtopic: Subtopic | Subtopic[] | null }).subtopic;
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  });

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <header>
        <div className="text-xs text-neutral-500">
          {new Date(row.starts_at).toLocaleString("ko-KR")}
          {row.location ? ` · ${row.location}` : ""}
        </div>
        <h1 className="mt-1 text-2xl font-bold">{row.title ?? "회차"}</h1>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-500">
          지금 와있는 사람 ({attendances?.length ?? 0})
        </h2>
        <ul className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {(attendances ?? []).map((a) => {
            type Profile = {
              id: string;
              display_name: string;
              avatar_url: string | null;
            };
            const rawUser = (a as { user: Profile | Profile[] | null }).user;
            const u = Array.isArray(rawUser) ? rawUser[0] ?? null : rawUser;
            if (!u) return null;
            return (
              <li key={u.id} className="flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold dark:bg-neutral-800">
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar_url}
                      alt={u.display_name}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    u.display_name.slice(0, 1)
                  )}
                </div>
                <div className="mt-1 text-xs">{u.display_name}</div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-500">
          오늘 한 것 ({subtopicRows.length})
        </h2>
        <ul className="mt-2 space-y-2">
          {subtopicRows.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <span>{s.title}</span>
              <span className="text-xs text-neutral-500">
                {new Date(s.created_at).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <AddTopicForm meetingId={meetingId} activityId={activityId} />
        </div>
      </section>

      {row.check_in_token && (
        <section className="mt-8 rounded-lg border border-dashed border-neutral-300 p-4 text-xs text-neutral-500 dark:border-neutral-700">
          출석 QR 경로: <code>/check-in/{row.check_in_token}</code>
        </section>
      )}
    </main>
  );
}
