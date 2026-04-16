"use client";

import { useActionState } from "react";
import { submitJoinMeeting, type JoinMeetingState } from "./actions";

const initial: JoinMeetingState = {};

export function JoinForm({ inviteToken }: { inviteToken: string }) {
  const [state, action, pending] = useActionState(submitJoinMeeting, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="invite_token" value={inviteToken} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">내 닉네임 (이 모임에서만)</span>
        <input
          name="nickname"
          defaultValue={state.values?.nickname ?? ""}
          maxLength={50}
          placeholder="비워두면 프로필 이름을 써"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "가입 중..." : "이 모임에 가입하기"}
      </button>
    </form>
  );
}
