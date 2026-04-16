import { describe, expect, it, vi } from "vitest";
import { requestSignupOtp, type OtpCapableAuth } from "./request-otp";

function makeAuth(overrides?: Partial<OtpCapableAuth>): OtpCapableAuth {
  return {
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

describe("requestSignupOtp", () => {
  it("calls signInWithOtp with email and name metadata, allowing user creation", async () => {
    const auth = makeAuth();

    const result = await requestSignupOtp(
      { auth },
      { email: "alice@example.com", name: "Alice" },
    );

    expect(result).toEqual({ ok: true, value: { email: "alice@example.com" } });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "alice@example.com",
      options: {
        shouldCreateUser: true,
        data: { display_name: "Alice" },
      },
    });
  });

  it("returns error when Supabase reports failure", async () => {
    const auth = makeAuth({
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: "rate limited" },
      }),
    });

    const result = await requestSignupOtp(
      { auth },
      { email: "alice@example.com", name: "Alice" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("rate limited");
    }
  });
});
