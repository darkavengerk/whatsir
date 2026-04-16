import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 활동 상세.
 * - 상단: 착석자 뷰 (처음 본 사람 파악용, 디스코드 멤버 리스트 패널 느낌)
 * - 중단: 세부활동 리스트 (독립 노드로 저장, 여기서는 연결만 표시)
 * - 하단: 채팅 (Supabase Realtime 구독)
 */
export default async function ActivityPage({
  params,
}: {
  params: Promise<{ meetingId: string; activityId: string }>;
}) {
  const { activityId } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("id, title, starts_at, location, description, check_in_token")
    .eq("id", activityId)
    .single();

  if (!activity) notFound();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("seat_order, user:profiles(id, display_name, avatar_url)")
    .eq("activity_id", activityId)
    .order("seat_order", { ascending: true, nullsFirst: false });

  const row = activity as {
    title: string | null;
    starts_at: string;
    location: string | null;
    description: string | null;
    check_in_token: string | null;
  };

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <header>
        <div className="text-xs text-neutral-500">
          {new Date(row.starts_at).toLocaleString("ko-KR")}
          {row.location ? ` · ${row.location}` : ""}
        </div>
        <h1 className="mt-1 text-2xl font-bold">
          {row.title ?? "회차"}
        </h1>
      </header>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-500">
          지금 와있는 사람 ({attendances?.length ?? 0})
        </h2>
        <ul className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {(attendances ?? []).map((a) => {
            type Profile = { id: string; display_name: string; avatar_url: string | null };
            const rawUser = (a as { user: Profile | Profile[] | null }).user;
            const u = Array.isArray(rawUser) ? rawUser[0] ?? null : rawUser;
            if (!u) return null;
            return (
              <li key={u.id} className="flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold dark:bg-neutral-800">
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar_url} alt={u.display_name} className="size-full rounded-full object-cover" />
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

      <section className="mt-8 rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
        세부활동, 사진, 후기, 채팅은 다음 단계에서 붙입니다.
        {row.check_in_token && (
          <div className="mt-2">
            출석 QR 경로: <code>/check-in/{row.check_in_token}</code>
          </div>
        )}
      </section>
    </main>
  );
}
