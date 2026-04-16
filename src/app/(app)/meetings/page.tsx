import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * 내가 속한 모임 목록.
 * RLS가 meeting_members를 통해 자동으로 필터링해주므로 쿼리가 단순하다.
 */
export default async function MeetingsPage() {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("meeting_members")
    .select("meeting:meetings(id, name, description, cover_url)")
    .order("joined_at", { ascending: false });

  type MeetingRow = { id: string; name: string; description: string | null; cover_url: string | null };
  const meetings = ((memberships ?? []) as Array<{ meeting: MeetingRow | MeetingRow[] | null }>).flatMap((m) => {
    if (!m.meeting) return [];
    return Array.isArray(m.meeting) ? m.meeting : [m.meeting];
  });

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 모임</h1>
        <Link
          href="/meetings/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          새 모임
        </Link>
      </header>

      {meetings.length === 0 ? (
        <p className="mt-12 text-center text-sm text-neutral-500">
          아직 가입한 모임이 없어요.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link
                href={`/meetings/${m.id}`}
                className="block rounded-xl border border-neutral-200 p-4 transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <div className="font-medium">{m.name}</div>
                {m.description && (
                  <div className="mt-1 line-clamp-2 text-sm text-neutral-500">
                    {m.description}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
