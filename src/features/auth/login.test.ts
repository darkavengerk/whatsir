import { describe, expect, it } from "vitest";
import { validateLoginInput } from "./login";

describe("validateLoginInput", () => {
  it("normalizes email (trim + lowercase)", () => {
    const result = validateLoginInput({ email: " Alice@Example.com " });
    expect(result).toEqual({ ok: true, value: { email: "alice@example.com" } });
  });

  it("rejects invalid email", () => {
    const result = validateLoginInput({ email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("email");
  });

  it("rejects empty email", () => {
    const result = validateLoginInput({ email: "  " });
    expect(result.ok).toBe(false);
  });
});
