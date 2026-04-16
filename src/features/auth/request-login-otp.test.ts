import { describe, expect, it, vi } from "vitest";
import { requestLoginOtp } from "./request-login-otp";

describe("requestLoginOtp", () => {
  it("requests OTP without creating a new user", async () => {
    const auth = { signInWithOtp: vi.fn().mockResolvedValue({ error: null }) };

    const result = await requestLoginOtp({ auth }, { email: "alice@example.com" });

    expect(result).toEqual({ ok: true, value: { email: "alice@example.com" } });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "alice@example.com",
      options: { shouldCreateUser: false },
    });
  });

  it("returns a user-friendly error when the account does not exist", async () => {
    const auth = {
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: "Signups not allowed for otp" },
      }),
    };

    const result = await requestLoginOtp({ auth }, { email: "ghost@example.com" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/가입.*없|등록/);
    }
  });

  it("surfaces generic errors as-is", async () => {
    const auth = {
      signInWithOtp: vi.fn().mockResolvedValue({
        error: { message: "rate limited" },
      }),
    };

    const result = await requestLoginOtp({ auth }, { email: "alice@example.com" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("rate limited");
  });
});
