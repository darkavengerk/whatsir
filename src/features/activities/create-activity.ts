import type { FieldError, Result } from "@/features/auth/signup";

export type ActivityInput = {
  title?: string;
  startsAt: string; // datetime-local 포맷 또는 ISO
  endsAt?: string;
  location?: string;
};

export type ValidatedActivityInput = {
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string;
};

function parseDate(input: string): Date | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateActivityInput(
  raw: ActivityInput,
): Result<ValidatedActivityInput, FieldError> {
  const title = (raw.title ?? "").trim();
  const location = (raw.location ?? "").trim();

  if (title.length > 80) {
    return {
      ok: false,
      error: { field: "name", message: "제목은 80자까지 가능해." },
    };
  }

  const startsAt = parseDate(raw.startsAt);
  if (!startsAt) {
    return {
      ok: false,
      error: { field: "name", message: "시작 시간을 입력해줘." },
    };
  }

  let endsAt: Date | null = null;
  const rawEnd = (raw.endsAt ?? "").trim();
  if (rawEnd.length > 0) {
    endsAt = parseDate(rawEnd);
    if (!endsAt) {
      return {
        ok: false,
        error: { field: "name", message: "끝나는 시간 형식이 올바르지 않아." },
      };
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      return {
        ok: false,
        error: { field: "name", message: "끝나는 시간은 시작 시간보다 뒤여야 해." },
      };
    }
  }

  return { ok: true, value: { title, startsAt, endsAt, location } };
}

export type ActivityRpcCapable = {
  rpc: (
    fn: "create_activity",
    params: {
      p_meeting_id: string;
      p_title: string;
      p_starts_at: string;
      p_ends_at: string | null;
      p_location: string;
    },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function createActivity(
  deps: ActivityRpcCapable,
  input: {
    meetingId: string;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    location: string;
  },
): Promise<Result<{ activityId: string }, { message: string }>> {
  const { data, error } = await deps.rpc("create_activity", {
    p_meeting_id: input.meetingId,
    p_title: input.title,
    p_starts_at: input.startsAt.toISOString(),
    p_ends_at: input.endsAt ? input.endsAt.toISOString() : null,
    p_location: input.location,
  });

  if (error || !data) {
    const raw = error?.message ?? "";
    const msg = /not_host/i.test(raw)
      ? "이 모임의 주최자(owner/host)만 활동을 만들 수 있어."
      : raw || "활동 생성 실패";
    return { ok: false, error: { message: msg } };
  }
  return { ok: true, value: { activityId: data } };
}
