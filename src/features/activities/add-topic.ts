import type { Result } from "@/features/auth/signup";

export function validateTopicTitle(raw: string): Result<string, { message: string }> {
  const title = raw.trim();
  if (title.length === 0) {
    return { ok: false, error: { message: "주제 이름을 입력해줘." } };
  }
  if (title.length > 100) {
    return { ok: false, error: { message: "주제 이름은 100자까지 가능해." } };
  }
  return { ok: true, value: title };
}

export type AddTopicRpcCapable = {
  rpc: (
    fn: "add_topic_to_activity",
    params: { p_activity_id: string; p_topic_title: string },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function addTopicToActivity(
  deps: AddTopicRpcCapable,
  input: { activityId: string; title: string },
): Promise<Result<{ subtopicId: string }, { message: string }>> {
  const { data, error } = await deps.rpc("add_topic_to_activity", {
    p_activity_id: input.activityId,
    p_topic_title: input.title,
  });

  if (error || !data) {
    const raw = error?.message ?? "";
    const msg = /not_member/i.test(raw)
      ? "이 모임의 멤버만 주제를 추가할 수 있어."
      : /not_found|activity_not_found/i.test(raw)
        ? "활동을 찾을 수 없어."
        : /empty_topic/i.test(raw)
          ? "주제 이름을 입력해줘."
          : raw || "주제 추가 실패";
    return { ok: false, error: { message: msg } };
  }
  return { ok: true, value: { subtopicId: data } };
}
