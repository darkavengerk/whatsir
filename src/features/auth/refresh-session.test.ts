import { describe, expect, it, vi } from "vitest";
import {
  refreshSessionFromDevice,
  type RefreshDeps,
} from "./refresh-session";

function makeDeps(overrides?: Partial<RefreshDeps>): RefreshDeps {
  return {
    resolveDevice: vi.fn().mockResolvedValue({ userId: "user-1" }),
    getUserEmail: vi.fn().mockResolvedValue("alice@example.com"),
    issueMagicLinkToken: vi
      .fn()
      .mockResolvedValue({ ok: true, hashedToken: "hashed-xyz" }),
    verifyMagicLink: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe("refreshSessionFromDevice", () => {
  it("goes through resolve → email → token → verify and returns userId+email", async () => {
    const deps = makeDeps();

    const result = await refreshSessionFromDevice(deps);

    expect(result).toEqual({
      ok: true,
      value: { userId: "user-1", email: "alice@example.com" },
    });
    expect(deps.getUserEmail).toHaveBeenCalledWith("user-1");
    expect(deps.issueMagicLinkToken).toHaveBeenCalledWith("alice@example.com");
    expect(deps.verifyMagicLink).toHaveBeenCalledWith({
      email: "alice@example.com",
      token: "hashed-xyz",
    });
  });

  it("returns error when device is not recognized", async () => {
    const deps = makeDeps({ resolveDevice: vi.fn().mockResolvedValue(null) });

    const result = await refreshSessionFromDevice(deps);

    expect(result.ok).toBe(false);
    expect(deps.getUserEmail).not.toHaveBeenCalled();
  });

  it("returns error when profile lacks an email", async () => {
    const deps = makeDeps({ getUserEmail: vi.fn().mockResolvedValue(null) });

    const result = await refreshSessionFromDevice(deps);

    expect(result.ok).toBe(false);
    expect(deps.issueMagicLinkToken).not.toHaveBeenCalled();
  });

  it("returns error when magic link issuance fails", async () => {
    const deps = makeDeps({
      issueMagicLinkToken: vi
        .fn()
        .mockResolvedValue({ ok: false, error: "generateLink failed" }),
    });

    const result = await refreshSessionFromDevice(deps);

    expect(result.ok).toBe(false);
    expect(deps.verifyMagicLink).not.toHaveBeenCalled();
  });

  it("returns error when verifyMagicLink fails", async () => {
    const deps = makeDeps({
      verifyMagicLink: vi.fn().mockResolvedValue({ ok: false, error: "invalid" }),
    });

    const result = await refreshSessionFromDevice(deps);

    expect(result.ok).toBe(false);
  });
});
