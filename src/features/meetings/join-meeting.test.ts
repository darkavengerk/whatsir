import { describe, expect, it, vi } from "vitest";
import { joinMeetingByInvite, validateJoinInput } from "./join-meeting";

describe("validateJoinInput", () => {
  it("trims invite token and nickname", () => {
    const result = validateJoinInput({ inviteToken: "  abc123  ", nickname: "  잭  " });
    expect(result).toEqual({
      ok: true,
      value: { inviteToken: "abc123", nickname: "잭" },
    });
  });

  it("rejects empty invite token", () => {
    const result = validateJoinInput({ inviteToken: "  ", nickname: "" });
    expect(result.ok).toBe(false);
  });

  it("allows empty nickname (profiles.display_name 폴백)", () => {
    const result = validateJoinInput({ inviteToken: "abc", nickname: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.nickname).toBe("");
  });

  it("rejects nickname > 50", () => {
    const result = validateJoinInput({
      inviteToken: "abc",
      nickname: "가".repeat(51),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("nickname");
  });
});

describe("joinMeetingByInvite", () => {
  it("calls join_meeting_by_invite RPC and returns meeting id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "meeting-1", error: null });

    const result = await joinMeetingByInvite(
      { rpc },
      { inviteToken: "abc", nickname: "잭" },
    );

    expect(result).toEqual({ ok: true, value: { meetingId: "meeting-1" } });
    expect(rpc).toHaveBeenCalledWith("join_meeting_by_invite", {
      p_invite_token: "abc",
      p_nickname: "잭",
    });
  });

  it("translates invalid_invite PG error into user-friendly message", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "invalid_invite" },
    });

    const result = await joinMeetingByInvite(
      { rpc },
      { inviteToken: "bad", nickname: "" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/초대.*유효/);
  });

  it("returns generic error otherwise", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "network blip" },
    });

    const result = await joinMeetingByInvite(
      { rpc },
      { inviteToken: "x", nickname: "" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("network blip");
  });
});
