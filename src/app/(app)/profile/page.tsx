import { requireClient } from "@/lib/supabase/server";
import { signOutAction } from "./actions";

export default async function ProfilePage() {
  const supabase = await requireClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, email, bio")
    .eq("id", user!.id)
    .single();

  const p = profile as {
    display_name: string;
    avatar_url: string | null;
    email: string | null;
    bio: string | null;
  } | null;

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold">내 프로필</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-neutral-500">이름</dt>
          <dd>{p?.display_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">이메일</dt>
          <dd>{p?.email ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">소개</dt>
          <dd>{p?.bio ?? "-"}</dd>
        </div>
      </dl>

      <form action={signOutAction} className="mt-10">
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          로그아웃
        </button>
        <p className="mt-2 text-xs text-neutral-500">
          이 기기의 자동 인식도 해제돼. 다시 들어오려면 로그인하면 돼.
        </p>
      </form>
    </main>
  );
}
