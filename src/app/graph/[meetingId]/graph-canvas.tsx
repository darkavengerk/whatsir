"use client";

/**
 * 3d-force-graph 렌더링 스텁.
 *
 * 실제 구현 시:
 *   import ForceGraph3D from "3d-force-graph";
 *   (또는 react-force-graph-3d를 쓰면 React 친화적)
 *
 *   - 색/모양을 kind(profile/meeting/topic/activity/subtopic)에 따라 다르게
 *   - 노드 클릭 시 해당 엔티티 상세 모달
 *   - 엣지 kind에 따라 선 스타일 구분
 *
 * 현재는 데이터 shape만 확인할 수 있는 JSON 덤프.
 */

type Node = { id: string; kind: string; label: string };
type Edge = { source: string; target: string; kind: string };

export function GraphCanvas({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="border-b border-neutral-200 px-6 py-3 text-sm dark:border-neutral-800">
        <span className="font-semibold">Graph</span>{" "}
        <span className="text-neutral-500">
          nodes: {nodes.length} · edges: {edges.length}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <p className="mb-2 text-xs text-neutral-500">
          TODO: 3d-force-graph로 치환. 지금은 데이터 shape 확인용.
        </p>
        <pre className="text-xs text-neutral-500">
          {JSON.stringify({ nodes, edges }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
