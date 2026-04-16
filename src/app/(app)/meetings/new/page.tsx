import Link from "next/link";
import { CreateMeetingForm } from "./create-meeting-form";

export default function NewMeetingPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
      <Link href="/meetings" className="text-xs text-neutral-500 underline underline-offset-4">
        ← 내 모임
      </Link>
      <h1 className="mt-3 text-xl font-bold">새 모임 만들기</h1>
      <p className="mt-2 text-sm text-neutral-500">
        지금 만들면 너는 owner가 돼. 용어·주제 템플릿·멤버 초대는 생성 후 설정 페이지에서.
      </p>
      <div className="mt-8">
        <CreateMeetingForm />
      </div>
    </main>
  );
}
