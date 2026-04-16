"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { registerDevice } from "@/lib/auth/device";
import { validateSignupInput } from "@/features/auth/signup";
import { requestSignupOtp } from "@/features/auth/request-otp";
import { verifySignupOtp } from "@/features/auth/verify-otp";

/**
 * signup은 두 단계 — 이메일+이름 제출 → OTP 입력.
 * 각 단계는 useActionState 친화적인 state 머신을 갖는다.
 */

export type SignupStepState =
  | { step: "request"; error?: string; values?: { name?: string; email?: string } }
  | {
      step: "verify";
      email: string;
      name: string;
      error?: string;
      returnTo?: string;
    }
  | { step: "done" };

export async function submitSignupRequest(
  prev: SignupStepState,
  formData: FormData,
): Promise<SignupStepState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const returnTo = String(formData.get("return_to") ?? "") || undefined;

  const validated = validateSignupInput({ name, email });
  if (!validated.ok) {
    return {
      step: "request",
      error: validated.error.message,
      values: { name, email },
    };
  }

  const supabase = await requireClient();
  const sent = await requestSignupOtp(
    { auth: supabase.auth },
    validated.value,
  );
  if (!sent.ok) {
    return {
      step: "request",
      error: sent.error.message,
      values: validated.value,
    };
  }

  void prev;
  return {
    step: "verify",
    email: validated.value.email,
    name: validated.value.name,
    returnTo,
  };
}

export async function submitSignupVerify(
  prev: SignupStepState,
  formData: FormData,
): Promise<SignupStepState> {
  if (prev.step !== "verify") {
    return { step: "request", error: "다시 시도해줘." };
  }

  const token = String(formData.get("token") ?? "").trim();
  if (!/^\d{6}$/.test(token)) {
    return { ...prev, error: "6자리 숫자 코드를 입력해줘." };
  }

  const supabase = await requireClient();
  const verified = await verifySignupOtp(
    {
      auth: supabase.auth,
      upsertProfile: async (p) => {
        const { error } = await supabase
          .from("profiles")
          .upsert(
            { id: p.id, display_name: p.displayName, email: p.email },
            { onConflict: "id" },
          );
        return { error: error ? { message: error.message } : null };
      },
    },
    { email: prev.email, token },
  );

  if (!verified.ok) {
    return { ...prev, error: verified.error.message };
  }

  const hdrs = await headers();
  try {
    await registerDevice({
      userId: verified.value.userId,
      label: "web",
      userAgent: hdrs.get("user-agent") ?? undefined,
    });
  } catch {
    // 디바이스 등록 실패는 치명적이지 않음 — 다음 방문 때 로그인으로 복구 가능.
  }

  redirect(prev.returnTo ?? "/meetings");
}
