"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSupabaseConfig,
  readSupabaseConfig,
  writeSupabaseConfig,
} from "@/lib/config/supabase-config";

export type SaveSupabaseConfigState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function saveSupabaseConfig(
  _prev: SaveSupabaseConfigState,
  formData: FormData,
): Promise<SaveSupabaseConfigState> {
  const url = String(formData.get("url") ?? "").trim();
  const anonKey = String(formData.get("anonKey") ?? "").trim();
  const serviceRoleKeyRaw = String(formData.get("serviceRoleKey") ?? "").trim();
  const serviceRoleKey = serviceRoleKeyRaw.length > 0 ? serviceRoleKeyRaw : null;

  if (!/^https?:\/\//.test(url)) {
    return { status: "error", message: "URL은 http(s)로 시작해야 해." };
  }
  if (anonKey.length < 20) {
    return { status: "error", message: "anon/publishable 키가 너무 짧아 보여." };
  }

  // 이미 env로 설정돼 있으면 env가 우선이므로 파일 쓰기는 무의미하다는 걸 알린다.
  const existing = await readSupabaseConfig();
  if (existing?.source === "env") {
    return {
      status: "error",
      message:
        "환경변수(NEXT_PUBLIC_SUPABASE_URL 등)가 이미 설정돼 있어. 파일 설정보다 우선이라 여기서 바꿔도 반영되지 않아. .env 또는 Vercel Env Vars를 수정해줘.",
    };
  }

  try {
    await writeSupabaseConfig({ url, anonKey, serviceRoleKey });
  } catch (err) {
    return {
      status: "error",
      message: `설정 파일 저장 실패: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}

export async function resetSupabaseConfig(): Promise<void> {
  await clearSupabaseConfig();
  revalidatePath("/", "layout");
  redirect("/settings");
}
