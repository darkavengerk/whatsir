import type { FieldError, Result } from "@/features/auth/signup";

export type JoinInput = {
  inviteToken: string;
  nickname?: string;
};

export type ValidatedJoinInput = {
  inviteToken: string;
  nickname: string;
};

export function validateJoinInput(
  raw: JoinInput,
): Result<ValidatedJoinInput, FieldError> {
  const inviteToken = raw.inviteToken.trim();
  const nickname = (raw.nickname ?? "").trim();

  if (inviteToken.length === 0) {
    return {
      ok: false,
      error: { field: "name", message: "초대 링크가 유효하지 않아." },
    };
  }
  if (nickname.length > 50) {
    return {
      ok: false,
      error: { field: "nickname", message: "모임 내 닉네임은 50자까지 가능해." },
    };
  }
  return { ok: true, value: { inviteToken, nickname } };
}

export type JoinRpcCapable = {
  rpc: (
    fn: "join_meeting_by_invite",
    params: { p_invite_token: string; p_nickname: string },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function joinMeetingByInvite(
  deps: JoinRpcCapable,
  input: ValidatedJoinInput,
): Promise<Result<{ meetingId: string }, { message: string }>> {
  const { data, error } = await deps.rpc("join_meeting_by_invite", {
    p_invite_token: input.inviteToken,
    p_nickname: input.nickname,
  });

  if (error || !data) {
    const msg = /invalid_invite/i.test(error?.message ?? "")
      ? "초대 링크가 유효하지 않거나 만료됐어."
      : error?.message ?? "가입에 실패했어.";
    return { ok: false, error: { message: msg } };
  }
  return { ok: true, value: { meetingId: data } };
}
