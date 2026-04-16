import { describe, expect, it, vi } from "vitest";
import { createMeeting, validateMeetingInput } from "./create-meeting";

describe("validateMeetingInput", () => {
  it("trims name and description, defaults description and nickname to empty", () => {
    const result = validateMeetingInput({ name: "  보드게임 모임  " });
    expect(result).toEqual({
      ok: true,
      value: { name: "보드게임 모임", description: "", nickname: "" },
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

  it("accepts a description and a nickname", () => {
    const result = validateMeetingInput({
      name: "독서 모임",
      description: "격주 수요일",
      nickname: "북토리",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe("격주 수요일");
      expect(result.value.nickname).toBe("북토리");
    }
  });

  it("rejects nickname longer than 50 chars", () => {
    const result = validateMeetingInput({ name: "a", nickname: "가".repeat(51) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("nickname");
  });
});

describe("createMeeting", () => {
  it("invokes create_meeting_as_owner RPC with validated input including nickname", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "meeting-1", error: null });

    const result = await createMeeting(
      { rpc },
      { name: "보드게임 모임", description: "금요일 저녁", nickname: "보드장인" },
    );

    expect(result).toEqual({ ok: true, value: { meetingId: "meeting-1" } });
    expect(rpc).toHaveBeenCalledWith("create_meeting_as_owner", {
      p_name: "보드게임 모임",
      p_description: "금요일 저녁",
      p_nickname: "보드장인",
    });
  });

  it("passes empty string for missing nickname", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "meeting-2", error: null });

    await createMeeting({ rpc }, { name: "x", description: "", nickname: "" });

    expect(rpc).toHaveBeenCalledWith("create_meeting_as_owner", {
      p_name: "x",
      p_description: "",
      p_nickname: "",
    });
  });

  it("returns error when RPC fails", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "nope" } });

    const result = await createMeeting(
      { rpc },
      { name: "x", description: "", nickname: "" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe("nope");
  });
});
