import { describe, expect, it, vi } from "vitest";
import { addTopicToActivity, validateTopicTitle } from "./add-topic";

describe("validateTopicTitle", () => {
  it("accepts trimmed non-empty title", () => {
    const r = validateTopicTitle("  카탄  ");
    expect(r).toEqual({ ok: true, value: "카탄" });
  });

  it("rejects empty", () => {
    const r = validateTopicTitle("   ");
    expect(r.ok).toBe(false);
  });

  it("rejects > 100 chars", () => {
    const r = validateTopicTitle("가".repeat(101));
    expect(r.ok).toBe(false);
  });
});

describe("addTopicToActivity", () => {
  it("calls add_topic_to_activity RPC with trimmed title and returns subtopic id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "sub-1", error: null });

    const r = await addTopicToActivity({ rpc }, { activityId: "a1", title: "카탄" });

    expect(r).toEqual({ ok: true, value: { subtopicId: "sub-1" } });
    expect(rpc).toHaveBeenCalledWith("add_topic_to_activity", {
      p_activity_id: "a1",
      p_topic_title: "카탄",
    });
  });

  it("translates not_member error", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "not_member" },
    });

    const r = await addTopicToActivity({ rpc }, { activityId: "a1", title: "카탄" });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/멤버|권한/);
  });
});
