"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/supabase/server";
import {
  addTopicToActivity,
  validateTopicTitle,
} from "@/features/activities/add-topic";

export type AddTopicState = {
  error?: string;
};

export async function submitAddTopic(
  args: { meetingId: string; activityId: string },
  _prev: AddTopicState,
  formData: FormData,
): Promise<AddTopicState> {
  const title = String(formData.get("title") ?? "");
  const validated = validateTopicTitle(title);
  if (!validated.ok) return { error: validated.error.message };

  const supabase = await requireClient();
  const result = await addTopicToActivity(
    {
      rpc: async (fn, params) => {
        const { data, error } = await supabase.rpc(fn, params);
        return {
          data: data as string | null,
          error: error ? { message: error.message } : null,
        };
      },
    },
    { activityId: args.activityId, title: validated.value },
  );

  if (!result.ok) return { error: result.error.message };

  revalidatePath(`/meetings/${args.meetingId}/activities/${args.activityId}`);
  return {};
}
