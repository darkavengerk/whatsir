/**
 * 앱 전역에서 쓰는 도메인 타입. DB 스키마에 1:1 매핑되는 것만 여기에.
 * UI-only한 타입은 각 컴포넌트 파일에 두자.
 */

export type MeetingRole = "owner" | "host" | "member" | "guest";

export type Meeting = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  coverUrl: string | null;
  /** 모임별 UI 라벨 커스터마이즈. 예: { activity: "모임", topic: "게임" } */
  terminology: Terminology;
  topicSchema: Record<string, unknown>;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Terminology = {
  activity?: string;   // 기본: "활동"
  activities?: string; // 기본: "활동들"
  topic?: string;      // 기본: "주제"
  topics?: string;     // 기본: "주제들"
  subtopic?: string;   // 기본: "세부활동"
  subtopics?: string;  // 기본: "세부활동들"
  member?: string;     // 기본: "멤버"
  members?: string;    // 기본: "멤버들"
};

export const DEFAULT_TERMINOLOGY: Required<Terminology> = {
  activity: "활동",
  activities: "활동",
  topic: "주제",
  topics: "주제",
  subtopic: "세부활동",
  subtopics: "세부활동",
  member: "멤버",
  members: "멤버",
};

/** terminology와 default를 머지한 resolver. */
export function resolveTerminology(t: Terminology | null | undefined): Required<Terminology> {
  return { ...DEFAULT_TERMINOLOGY, ...(t ?? {}) };
}
