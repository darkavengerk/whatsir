import { describe, expect, it, vi } from "vitest";
import { verifySignupOtp, type VerifyOtpDeps } from "./verify-otp";

function makeDeps(overrides?: Partial<VerifyOtpDeps>): VerifyOtpDeps {
  return {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "alice@example.com",
            user_metadata: { display_name: "Alice" },
          },
        },
        error: null,
      }),
    },
    upsertProfile: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

describe("verifySignupOtp", () => {
  it("verifies the OTP and upserts a profile using user metadata", async () => {
    const deps = makeDeps();

    const result = await verifySignupOtp(deps, {
      email: "alice@example.com",
      token: "123456",
    });

    expect(result).toEqual({
      ok: true,
      value: { userId: "user-1", displayName: "Alice" },
    });
    expect(deps.auth.verifyOtp).toHaveBeenCalledWith({
      email: "alice@example.com",
      token: "123456",
      type: "email",
    });
    expect(deps.upsertProfile).toHaveBeenCalledWith({
      id: "user-1",
      displayName: "Alice",
      email: "alice@example.com",
    });
  });

  it("returns error when OTP is invalid", async () => {
    const deps = makeDeps({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Token has expired or is invalid" },
        }),
      },
    });

    const result = await verifySignupOtp(deps, {
      email: "alice@example.com",
      token: "wrong",
    });

    expect(result.ok).toBe(false);
    expect(deps.upsertProfile).not.toHaveBeenCalled();
  });

  it("returns error when profile upsert fails", async () => {
    const deps = makeDeps({
      upsertProfile: vi.fn().mockResolvedValue({ error: { message: "db down" } }),
    });

    const result = await verifySignupOtp(deps, {
      email: "alice@example.com",
      token: "123456",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("db down");
  });

  it("falls back to email local-part when display_name missing", async () => {
    const deps = makeDeps({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-2",
              email: "bob@example.com",
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    });

    const result = await verifySignupOtp(deps, {
      email: "bob@example.com",
      token: "123456",
    });

    expect(result).toEqual({
      ok: true,
      value: { userId: "user-2", displayName: "bob" },
    });
    expect(deps.upsertProfile).toHaveBeenCalledWith({
      id: "user-2",
      displayName: "bob",
      email: "bob@example.com",
    });
  });
});
