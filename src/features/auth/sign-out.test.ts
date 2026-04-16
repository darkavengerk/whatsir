import { describe, expect, it, vi } from "vitest";
import { performSignOut } from "./sign-out";

describe("performSignOut", () => {
  it("calls both supabase.signOut and revokeDevice", async () => {
    const auth = { signOut: vi.fn().mockResolvedValue({ error: null }) };
    const revokeDevice = vi.fn().mockResolvedValue(undefined);

    const result = await performSignOut({ auth, revokeDevice });

    expect(result).toEqual({ ok: true });
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(revokeDevice).toHaveBeenCalledOnce();
  });

  it("still revokes the device even if supabase.signOut errors", async () => {
    const auth = {
      signOut: vi.fn().mockResolvedValue({ error: { message: "boom" } }),
    };
    const revokeDevice = vi.fn().mockResolvedValue(undefined);

    const result = await performSignOut({ auth, revokeDevice });

    // supabase 쿠키는 어차피 server에서 비워지므로 전체는 ok로 취급.
    expect(result.ok).toBe(true);
    expect(revokeDevice).toHaveBeenCalledOnce();
  });
});
