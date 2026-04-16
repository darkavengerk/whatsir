"use client";

import { useActionState } from "react";
import { submitCreateActivity, type CreateActivityState } from "./actions";

const initial: CreateActivityState = {};

export function CreateActivityForm({ meetingId }: { meetingId: string }) {
  const [state, action, pending] = useActionState(
    async (prev: CreateActivityState, fd: FormData) =>
      submitCreateActivity(meetingId, prev, fd),
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">제목 (선택)</span>
        <input
          name="title"
          defaultValue={state.values?.title ?? ""}
          maxLength={80}
          placeholder="비우면 날짜로 표시돼"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">시작 시간</span>
        <input
          type="datetime-local"
          name="starts_at"
          defaultValue={state.values?.startsAt ?? ""}
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">끝나는 시간 (선택)</span>
        <input
          type="datetime-local"
          name="ends_at"
          defaultValue={state.values?.endsAt ?? ""}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">장소 (선택)</span>
        <input
          name="location"
          defaultValue={state.values?.location ?? ""}
          placeholder="예: 강남 보드게임카페"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "만드는 중..." : "활동 만들기"}
      </button>
    </form>
  );
}
