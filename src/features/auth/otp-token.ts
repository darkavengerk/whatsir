/**
 * Supabase OTP 토큰 형식 검증.
 *
 * Supabase는 프로젝트 설정(Auth → Email OTP length)에 따라 6자리 또는 8자리를 발송한다.
 * 클라이언트가 특정 길이에 하드코딩되면 설정 변경 시 UI가 깨지므로,
 * 4~10자리 숫자 범위에서 허용하고 최종 검증은 Supabase에 맡긴다.
 */
export const OTP_MIN_LENGTH = 4;
export const OTP_MAX_LENGTH = 10;

const OTP_RE = new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`);

export function isValidOtpToken(token: string): boolean {
  return OTP_RE.test(token);
}
