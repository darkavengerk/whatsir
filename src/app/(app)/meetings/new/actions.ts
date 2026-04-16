"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import { createMeeting, validateMeetingInput } from "@/features/meetings/create-meeting";

export type CreateMeetingState = {
  error?: string;
  values?: { name?: string; description?: string };
};

export async function submitCreateMeeting(
  _prev: CreateMeetingState,
  formData: FormData,
): Promise<CreateMeetingState> {
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");

  const validated = validateMeetingInput({ name, description });
  if (!validated.ok) {
    return { error: validated.error.message, values: { name, description } };
  }

  const supabase = await requireClient();
  const result = await createMeeting(
    {
      rpc: async (fn, params) => {
        const { data, error } = await supabase.rpc(fn, params);
        return { data: data as string | null, error: error ? { message: error.message } : null };
      },
    },
    validated.value,
  );
  if (!result.ok) {
    return { error: result.error.message, values: validated.value };
  }

  revalidatePath("/meetings");
  redirect(`/meetings/${result.value.meetingId}`);
}
