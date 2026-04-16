"use client";

import { useActionState } from "react";
import {
  submitSignupRequest,
  submitSignupVerify,
  type SignupStepState,
} from "./actions";

const initial: SignupStepState = { step: "request" };

export function SignupForm({ returnTo }: { returnTo?: string }) {
  const [state, action] = useActionState(dispatch, initial);

  async function dispatch(prev: SignupStepState, formData: FormData) {
    if (prev.step === "verify") {
      return submitSignupVerify(prev, formData);
    }
    return submitSignupRequest(prev, formData);
  }

  if (state.step === "verify") {
    return (
      <form action={action} className="space-y-4">
        <p className="text-sm text-neutral-500">
          <strong>{state.email}</strong> 로 6자리 코드를 보냈어. 메일을 확인하고 입력해줘.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">인증 코드</span>
          <input
            name="token"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm tracking-[0.4em] dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          확인
        </button>
        <p className="text-xs text-neutral-500">
          코드가 안 왔어? 스팸함도 확인하고, 그래도 없으면 새로고침 후 다시 요청해줘.
        </p>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">이름</span>
        <input
          name="name"
          defaultValue={state.step === "request" ? state.values?.name ?? "" : ""}
          required
          maxLength={50}
          autoComplete="name"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">이메일</span>
        <input
          name="email"
          type="email"
          defaultValue={state.step === "request" ? state.values?.email ?? "" : ""}
          required
          autoComplete="email"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {state.step === "request" && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        인증 코드 받기
      </button>
    </form>
  );
}
