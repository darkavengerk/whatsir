"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitAddTopic, type AddTopicState } from "./actions";

const initial: AddTopicState = {};

export function AddTopicForm({
  meetingId,
  activityId,
}: {
  meetingId: string;
  activityId: string;
}) {
  const [state, action, pending] = useActionState(
    async (prev: AddTopicState, fd: FormData) =>
      submitAddTopic({ meetingId, activityId }, prev, fd),
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // 성공 후(error가 없고 pending도 끝난 뒤) 폼을 리셋해 다음 주제 바로 입력 가능하게.
  useEffect(() => {
    if (!pending && !state.error && formRef.current) {
      formRef.current.reset();
    }
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input
        name="title"
        maxLength={100}
        required
        placeholder="예: 카탄"
        className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "추가 중..." : "+ 주제"}
      </button>
      {state.error && (
        <span className="text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}
