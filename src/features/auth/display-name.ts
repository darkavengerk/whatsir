/**
 * auth 사용자 정보에서 표시 이름을 뽑아낸다.
 * 1순위: metadata.display_name (trim 후 비어있지 않으면)
 * 2순위: email의 @ 앞부분
 * 3순위: 빈 문자열
 */
export function resolveDisplayName(user: {
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const rawMeta = user.metadata?.display_name;
  if (typeof rawMeta === "string") {
    const trimmed = rawMeta.trim();
    if (trimmed.length > 0) return trimmed;
  }
  const email = user.email ?? "";
  return email.split("@")[0] ?? "";
}
