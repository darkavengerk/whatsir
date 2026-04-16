import { describe, expect, it, vi } from "vitest";
import { verifyLoginOtp } from "./verify-login-otp";

describe("verifyLoginOtp", () => {
  it("returns userId when OTP is valid", async () => {
    const auth = {
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "alice@example.com" } },
        error: null,
      }),
    };

    const result = await verifyLoginOtp(
      { auth },
      { email: "alice@example.com", token: "123456" },
    );

    expect(result).toEqual({ ok: true, value: { userId: "user-1" } });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "alice@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("returns error when OTP invalid", async () => {
    const auth = {
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Token expired" },
      }),
    };

    const result = await verifyLoginOtp(
      { auth },
      { email: "alice@example.com", token: "wrong" },
    );

    expect(result.ok).toBe(false);
  });
});
