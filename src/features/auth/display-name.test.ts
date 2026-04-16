import { describe, expect, it } from "vitest";
import { resolveDisplayName } from "./display-name";

describe("resolveDisplayName", () => {
  it("uses trimmed display_name from metadata when present", () => {
    expect(
      resolveDisplayName({
        email: "alice@example.com",
        metadata: { display_name: "  Alice  " },
      }),
    ).toBe("Alice");
  });

  it("falls back to email local-part when display_name is empty string", () => {
    expect(
      resolveDisplayName({
        email: "alice@example.com",
        metadata: { display_name: "" },
      }),
    ).toBe("alice");
  });

  it("falls back to email local-part when display_name is whitespace", () => {
    expect(
      resolveDisplayName({
        email: "alice@example.com",
        metadata: { display_name: "   " },
      }),
    ).toBe("alice");
  });

  it("falls back when metadata is missing", () => {
    expect(resolveDisplayName({ email: "bob@example.com" })).toBe("bob");
  });

  it("falls back when display_name is not a string", () => {
    expect(
      resolveDisplayName({
        email: "carol@example.com",
        metadata: { display_name: 42 },
      }),
    ).toBe("carol");
  });

  it("returns empty string when both metadata and email are missing", () => {
    expect(resolveDisplayName({})).toBe("");
  });
});
