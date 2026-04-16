import { describe, expect, it, vi } from "vitest";
import { createActivity, validateActivityInput } from "./create-activity";

describe("validateActivityInput", () => {
  it("accepts valid input with all fields", () => {
    const result = validateActivityInput({
      title: "  4월 셋째 주 모임  ",
      startsAt: "2026-04-18T19:00",
      endsAt: "2026-04-18T23:00",
      location: "  강남 보드게임카페  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("4월 셋째 주 모임");
      expect(result.value.location).toBe("강남 보드게임카페");
      expect(result.value.startsAt).toBeInstanceOf(Date);
      expect(result.value.endsAt).toBeInstanceOf(Date);
    }
  });

  it("allows optional title, endsAt, location", () => {
    const result = validateActivityInput({ startsAt: "2026-04-18T19:00" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("");
      expect(result.value.endsAt).toBeNull();
      expect(result.value.location).toBe("");
    }
  });

  it("rejects empty startsAt", () => {
    const result = validateActivityInput({ startsAt: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("name");
  });

  it("rejects invalid startsAt", () => {
    const result = validateActivityInput({ startsAt: "nope" });
    expect(result.ok).toBe(false);
  });

  it("rejects endsAt <= startsAt", () => {
    const result = validateActivityInput({
      startsAt: "2026-04-18T19:00",
      endsAt: "2026-04-18T18:00",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects title longer than 80 chars", () => {
    const result = validateActivityInput({
      title: "가".repeat(81),
      startsAt: "2026-04-18T19:00",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("name");
  });
});

describe("createActivity", () => {
  it("calls create_activity RPC with ISO datetimes", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "activity-1", error: null });

    const input = {
      meetingId: "meeting-1",
      title: "회차 1",
      startsAt: new Date("2026-04-18T10:00:00Z"),
      endsAt: new Date("2026-04-18T14:00:00Z"),
      location: "강남",
    };

    const result = await createActivity({ rpc }, input);

    expect(result).toEqual({ ok: true, value: { activityId: "activity-1" } });
    expect(rpc).toHaveBeenCalledWith("create_activity", {
      p_meeting_id: "meeting-1",
      p_title: "회차 1",
      p_starts_at: "2026-04-18T10:00:00.000Z",
      p_ends_at: "2026-04-18T14:00:00.000Z",
      p_location: "강남",
    });
  });

  it("passes null endsAt when absent", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "a2", error: null });

    await createActivity(
      { rpc },
      {
        meetingId: "m1",
        title: "",
        startsAt: new Date("2026-04-18T10:00:00Z"),
        endsAt: null,
        location: "",
      },
    );

    expect(rpc).toHaveBeenCalledWith("create_activity", {
      p_meeting_id: "m1",
      p_title: "",
      p_starts_at: "2026-04-18T10:00:00.000Z",
      p_ends_at: null,
      p_location: "",
    });
  });

  it("translates not_host error into user-friendly message", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "not_host" },
    });

    const result = await createActivity(
      { rpc },
      {
        meetingId: "m1",
        title: "x",
        startsAt: new Date(),
        endsAt: null,
        location: "",
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/주최자|권한/);
  });
});
