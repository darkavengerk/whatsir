"use server";

import { redirect } from "next/navigation";
import { requireClient } from "@/lib/supabase/server";
import {
  joinMeetingByInvite,
  validateJoinInput,
} from "@/features/meetings/join-meeting";

export type JoinMeetingState = {
  error?: string;
  values?: { nickname?: string };
};

export async function submitJoinMeeting(
  _prev: JoinMeetingState,
  formData: FormData,
): Promise<JoinMeetingState> {
  const inviteToken = String(formData.get("invite_token") ?? "");
  const nickname = String(formData.get("nickname") ?? "");

  const validated = validateJoinInput({ inviteToken, nickname });
  if (!validated.ok) {
    return { error: validated.error.message, values: { nickname } };
  }

  const supabase = await requireClient();
  const result = await joinMeetingByInvite(
    {
      rpc: async (fn, params) => {
        const { data, error } = await supabase.rpc(fn, params);
        return {
          data: data as string | null,
          error: error ? { message: error.message } : null,
        };
      },
    },
    validated.value,
  );

  if (!result.ok) {
    return { error: result.error.message, values: { nickname } };
  }

  redirect(`/meetings/${result.value.meetingId}`);
}
