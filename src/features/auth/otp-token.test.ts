import { describe, expect, it } from "vitest";
import { isValidOtpToken } from "./otp-token";

describe("isValidOtpToken", () => {
  it("accepts 6 digits", () => {
    expect(isValidOtpToken("123456")).toBe(true);
  });

  it("accepts 8 digits (Supabase가 길이를 바꿀 수 있음)", () => {
    expect(isValidOtpToken("12345678")).toBe(true);
  });

  it("accepts any numeric length between 4 and 10", () => {
    expect(isValidOtpToken("1234")).toBe(true);
    expect(isValidOtpToken("1234567890")).toBe(true);
  });

  it("rejects too short (under 4)", () => {
    expect(isValidOtpToken("123")).toBe(false);
  });

  it("rejects too long (over 10)", () => {
    expect(isValidOtpToken("12345678901")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isValidOtpToken("12ab56")).toBe(false);
    expect(isValidOtpToken("123 456")).toBe(false);
  });

  it("rejects empty", () => {
    expect(isValidOtpToken("")).toBe(false);
  });
});
