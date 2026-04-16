"use server";

import { redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { revokeCurrentDevice } from "@/lib/auth/device";
import { performSignOut } from "@/features/auth/sign-out";

export async function signOutAction() {
  const supabase = await requireClient();
  await performSignOut({
    auth: { signOut: () => supabase.auth.signOut() },
    revokeDevice: revokeCurrentDevice,
  });
  redirect("/");
}
