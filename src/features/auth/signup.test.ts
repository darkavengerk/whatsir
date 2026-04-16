import { describe, expect, it } from "vitest";
import { validateSignupInput } from "./signup";

describe("validateSignupInput", () => {
  it("accepts trimmed name and lowercased email", () => {
    const result = validateSignupInput({ name: "  Alice  ", email: "Alice@Example.com " });
    expect(result).toEqual({
      ok: true,
      value: { name: "Alice", email: "alice@example.com" },
    });
  });

  it("rejects empty name", () => {
    const result = validateSignupInput({ name: "  ", email: "alice@example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe("name");
    }
  });

  it("rejects name longer than 50 chars", () => {
    const longName = "가".repeat(51);
    const result = validateSignupInput({ name: longName, email: "alice@example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe("name");
    }
  });

  it("rejects email without @", () => {
    const result = validateSignupInput({ name: "Alice", email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe("email");
    }
  });

  it("rejects email with whitespace inside", () => {
    const result = validateSignupInput({ name: "Alice", email: "a b@example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe("email");
    }
  });
});
