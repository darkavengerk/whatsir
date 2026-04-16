/**
 * Supabase CLI가 생성할 타입이 들어갈 자리.
 *
 *   npx supabase gen types typescript --project-id <id> --schema public \
 *     > src/types/database.ts
 *
 * 아직 원격 프로젝트가 없으므로 일단 permissive한 placeholder를 둔다.
 * 생성 후에는 이 파일을 통째로 덮어쓰면 된다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
