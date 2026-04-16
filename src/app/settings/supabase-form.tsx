"use client";

import { useActionState } from "react";
import {
  saveSupabaseConfig,
  type SaveSupabaseConfigState,
} from "./actions";

const initialState: SaveSupabaseConfigState = { status: "idle" };

export function SupabaseConfigForm({
  defaultUrl,
  defaultAnonKey,
  defaultServiceRoleKey,
  locked,
}: {
  defaultUrl?: string;
  defaultAnonKey?: string;
  defaultServiceRoleKey?: string;
  /** env로 설정돼 있어 파일 쓰기가 무시되는 경우 readonly 모드. */
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveSupabaseConfig, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Project URL"
        name="url"
        placeholder="https://xxxxx.supabase.co"
        defaultValue={defaultUrl}
        disabled={locked}
        required
      />
      <Field
        label="Publishable (anon) key"
        name="anonKey"
        placeholder="sb_publishable_..."
        defaultValue={defaultAnonKey}
        disabled={locked}
        required
      />
      <Field
        label="Service role (secret) key"
        name="serviceRoleKey"
        placeholder="sb_secret_... (QR 체크인/디바이스 등록에 필요)"
        defaultValue={defaultServiceRoleKey}
        disabled={locked}
        type="password"
      />

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-sm text-green-600">저장됐어. 페이지를 새로고침하면 적용된 상태로 볼 수 있어.</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={locked || pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
        {locked && (
          <span className="text-xs text-neutral-500">
            환경변수가 우선 적용 중이라 여기서는 변경 불가.
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  disabled,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  type?: "text" | "password";
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        autoComplete="off"
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:disabled:bg-neutral-800"
      />
    </label>
  );
}
