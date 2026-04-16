"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { registerDevice } from "@/lib/auth/device";
import { validateLoginInput } from "@/features/auth/login";
import { requestLoginOtp } from "@/features/auth/request-login-otp";
import { verifyLoginOtp } from "@/features/auth/verify-login-otp";

export type LoginStepState =
  | { step: "request"; error?: string; values?: { email?: string } }
  | { step: "verify"; email: string; error?: string; returnTo?: string };

export async function submitLoginRequest(
  _prev: LoginStepState,
  formData: FormData,
): Promise<LoginStepState> {
  const email = String(formData.get("email") ?? "");
  const returnTo = String(formData.get("return_to") ?? "") || undefined;

  const validated = validateLoginInput({ email });
  if (!validated.ok) {
    return { step: "request", error: validated.error.message, values: { email } };
  }

  const supabase = await requireClient();
  const sent = await requestLoginOtp({ auth: supabase.auth }, validated.value);
  if (!sent.ok) {
    return { step: "request", error: sent.error.message, values: validated.value };
  }

  return { step: "verify", email: validated.value.email, returnTo };
}

export async function submitLoginVerify(
  prev: LoginStepState,
  formData: FormData,
): Promise<LoginStepState> {
  if (prev.step !== "verify") {
    return { step: "request", error: "다시 시도해줘." };
  }

  const token = String(formData.get("token") ?? "").trim();
  if (!/^\d{6}$/.test(token)) {
    return { ...prev, error: "6자리 숫자 코드를 입력해줘." };
  }

  const supabase = await requireClient();
  const verified = await verifyLoginOtp(
    { auth: supabase.auth },
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
    // 디바이스 등록 실패는 치명적이지 않음.
  }

  redirect(prev.returnTo ?? "/meetings");
}
