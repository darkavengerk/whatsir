"use client";

import { useActionState } from "react";
import { submitCreateMeeting, type CreateMeetingState } from "./actions";

const initial: CreateMeetingState = {};

export function CreateMeetingForm() {
  const [state, action, pending] = useActionState(submitCreateMeeting, initial);

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">모임 이름</span>
        <input
          name="name"
          defaultValue={state.values?.name ?? ""}
          required
          maxLength={80}
          placeholder="예: 보드게임 크루"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">소개 (선택)</span>
        <textarea
          name="description"
          defaultValue={state.values?.description ?? ""}
          rows={3}
          placeholder="어떤 모임이야?"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">내 닉네임 (모임 내)</span>
        <input
          name="nickname"
          defaultValue={state.values?.nickname ?? ""}
          maxLength={50}
          placeholder="비워두면 프로필 이름을 써"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          이 모임에서만 표시될 이름. 다른 모임에서는 따로 설정할 수 있어.
        </span>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "만드는 중..." : "모임 만들기"}
      </button>
    </form>
  );
}
