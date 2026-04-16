import type { FieldError, Result } from "@/features/auth/signup";

export type MeetingInput = {
  name: string;
  description?: string;
  nickname?: string;
};

export type ValidatedMeetingInput = {
  name: string;
  description: string;
  nickname: string;
};

/**
 * 모임 생성 입력 검증.
 * - name: trim, 1~80자
 * - description: trim, 선택
 * - nickname: trim, 0~50자 (빈 문자열 허용 — 모임별 별명 미사용 시 profiles.display_name 폴백)
 */
export function validateMeetingInput(
  raw: MeetingInput,
): Result<ValidatedMeetingInput, FieldError> {
  const name = raw.name.trim();
  const description = (raw.description ?? "").trim();
  const nickname = (raw.nickname ?? "").trim();

  if (name.length === 0) {
    return { ok: false, error: { field: "name", message: "모임 이름을 입력해줘." } };
  }
  if (name.length > 80) {
    return { ok: false, error: { field: "name", message: "이름은 80자까지 가능해." } };
  }
  if (nickname.length > 50) {
    return {
      ok: false,
      error: { field: "nickname", message: "모임 내 닉네임은 50자까지 가능해." },
    };
  }

  return { ok: true, value: { name, description, nickname } };
}

/**
 * 필요한 RPC 인터페이스. SupabaseClient["rpc"]가 이 shape를 충족.
 */
export type RpcCapable = {
  rpc: (
    fn: "create_meeting_as_owner",
    params: { p_name: string; p_description: string; p_nickname: string },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

/**
 * 모임 생성. 트랜잭션 안전성을 위해 DB function을 호출한다.
 * `create_meeting_as_owner`는 meetings insert + meeting_members(owner, nickname) insert를
 * 원자적으로 수행하며 invite_token도 발급한다.
 */
export async function createMeeting(
  deps: RpcCapable,
  input: ValidatedMeetingInput,
): Promise<Result<{ meetingId: string }, { message: string }>> {
  const { data, error } = await deps.rpc("create_meeting_as_owner", {
    p_name: input.name,
    p_description: input.description,
    p_nickname: input.nickname,
  });

  if (error || !data) {
    return { ok: false, error: { message: error?.message ?? "모임 생성 실패" } };
  }
  return { ok: true, value: { meetingId: data } };
}
