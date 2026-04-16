import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * 런타임 Supabase 설정.
 *
 * 우선순위:
 *   1. 환경변수 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
 *   2. 설정 파일 (.whatsir/supabase.json) — 개발/self-host 용
 *
 * 프로덕션 Vercel은 파일 시스템이 읽기 전용이므로 반드시 환경변수 경로를 쓴다.
 * 설정 파일 경로는 개발 중 UI에서 부트스트랩할 때만 유의미하다.
 */

export type SupabaseConfig = {
  url: string;
  anonKey: string;
  /** 관리자 플로우(체크인 업서트, 디바이스 등록)용. 없어도 읽기 RLS는 동작. */
  serviceRoleKey: string | null;
  source: "env" | "file";
};

const CONFIG_DIR = ".whatsir";
const CONFIG_FILE = "supabase.json";

function configFilePath() {
  return path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
}

async function readConfigFile(): Promise<Omit<SupabaseConfig, "source"> | null> {
  try {
    const raw = await fs.readFile(configFilePath(), "utf8");
    const parsed = JSON.parse(raw) as {
      url?: string;
      anonKey?: string;
      serviceRoleKey?: string | null;
    };
    if (!parsed.url || !parsed.anonKey) return null;
    return {
      url: parsed.url,
      anonKey: parsed.anonKey,
      serviceRoleKey: parsed.serviceRoleKey ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * 현재 적용 가능한 Supabase 설정을 반환. 없으면 null.
 * 매 요청마다 호출해도 무방(파일은 작고, 환경변수는 메모리 접근).
 */
export async function readSupabaseConfig(): Promise<SupabaseConfig | null> {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const envService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envUrl && envAnon) {
    return {
      url: envUrl,
      anonKey: envAnon,
      serviceRoleKey: envService ?? null,
      source: "env",
    };
  }

  const fileCfg = await readConfigFile();
  if (fileCfg) return { ...fileCfg, source: "file" };

  return null;
}

export async function isSupabaseConfigured(): Promise<boolean> {
  return (await readSupabaseConfig()) !== null;
}

/**
 * 부트스트랩용. 개발/self-host 환경에서만 의미가 있다.
 * Vercel 프로덕션(읽기 전용 FS)에서는 호출해도 쓰기 실패.
 */
export async function writeSupabaseConfig(input: {
  url: string;
  anonKey: string;
  serviceRoleKey: string | null;
}): Promise<void> {
  const dir = path.join(process.cwd(), CONFIG_DIR);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, CONFIG_FILE);
  const payload = JSON.stringify(
    {
      url: input.url,
      anonKey: input.anonKey,
      serviceRoleKey: input.serviceRoleKey,
    },
    null,
    2,
  );
  await fs.writeFile(file, payload, { encoding: "utf8", mode: 0o600 });
}

export async function clearSupabaseConfig(): Promise<void> {
  try {
    await fs.unlink(configFilePath());
  } catch {
    /* 파일이 없을 수 있음 — 무시 */
  }
}
