"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import {
  createActivity,
  validateActivityInput,
} from "@/features/activities/create-activity";

export type CreateActivityState = {
  error?: string;
  values?: {
    title?: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
  };
};

export async function submitCreateActivity(
  meetingId: string,
  _prev: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
  const title = String(formData.get("title") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const location = String(formData.get("location") ?? "");

  const validated = validateActivityInput({ title, startsAt, endsAt, location });
  if (!validated.ok) {
    return {
      error: validated.error.message,
      values: { title, startsAt, endsAt, location },
    };
  }

  const supabase = await requireClient();
  const result = await createActivity(
    {
      rpc: async (fn, params) => {
        const { data, error } = await supabase.rpc(fn, params);
        return {
          data: data as string | null,
          error: error ? { message: error.message } : null,
        };
      },
    },
    { meetingId, ...validated.value },
  );

  if (!result.ok) {
    return { error: result.error.message, values: { title, startsAt, endsAt, location } };
  }

  revalidatePath(`/meetings/${meetingId}`);
  redirect(`/meetings/${meetingId}/activities/${result.value.activityId}`);
}
