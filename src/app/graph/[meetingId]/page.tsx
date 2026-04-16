import { requireClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GraphCanvas } from "./graph-canvas";

/**
 * 데스크톱 그래프 탐색 페이지.
 *
 * graph_nodes / graph_edges 뷰를 읽어서 클라이언트에서 3d-force-graph로 렌더링한다.
 * 이 페이지 자체는 모바일에서도 접근 가능하지만 UX상 데스크톱 권장.
 */
export default async function MeetingGraphPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const supabase = await requireClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?return_to=/graph/${meetingId}`);

  const [{ data: nodes }, { data: edges }] = await Promise.all([
    supabase.from("graph_nodes").select("*").or(`meeting_id.eq.${meetingId},kind.eq.profile`),
    supabase.from("graph_edges").select("*").eq("meeting_id", meetingId),
  ]);

  return (
    <main className="flex-1">
      <GraphCanvas
        nodes={(nodes ?? []) as Array<{ id: string; kind: string; label: string }>}
        edges={(edges ?? []) as Array<{ source: string; target: string; kind: string }>}
      />
    </main>
  );
}
