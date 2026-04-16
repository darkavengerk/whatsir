import { describe, expect, it, vi } from "vitest";
import { createMeeting, validateMeetingInput } from "./create-meeting";

describe("validateMeetingInput", () => {
  it("trims name and description, defaults description to empty", () => {
    const result = validateMeetingInput({ name: "  보드게임 모임  " });
    expect(result).toEqual({
      ok: true,
      value: { name: "보드게임 모임", description: "" },
    });
  });

  it("rejects empty name", () => {
    const result = validateMeetingInput({ name: "  " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("name");
  });

  it("rejects name longer than 80 chars", () => {
    const result = validateMeetingInput({ name: "가".repeat(81) });
    expect(result.ok).toBe(false);
  });

  it("accepts a description", () => {
    const result = validateMeetingInput({
      name: "독서 모임",
      description: "격주 수요일",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBe("격주 수요일");
  });
});

describe("createMeeting", () => {
  it("invokes create_meeting_as_owner RPC with validated input", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "meeting-1", error: null });

    const result = await createMeeting(
      { rpc },
      { name: "보드게임 모임", description: "금요일 저녁" },
    );

    expect(result).toEqual({ ok: true, value: { meetingId: "meeting-1" } });
    expect(rpc).toHaveBeenCalledWith("create_meeting_as_owner", {
      p_name: "보드게임 모임",
      p_description: "금요일 저녁",
    });
  });

  it("returns error when RPC fails", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "nope" } });

    const result = await createMeeting({ rpc }, { name: "x", description: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe("nope");
  });
});
