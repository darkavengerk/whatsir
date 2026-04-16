import Link from "next/link";
import { CreateActivityForm } from "./create-activity-form";

export default async function NewActivityPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
      <Link
        href={`/meetings/${meetingId}`}
        className="text-xs text-neutral-500 underline underline-offset-4"
      >
        ← 모임으로
      </Link>
      <h1 className="mt-3 text-xl font-bold">새 활동 만들기</h1>
      <p className="mt-2 text-sm text-neutral-500">
        생성되면 QR 체크인 토큰이 자동으로 발급돼. 주최자(owner/host)만 만들 수 있어.
      </p>
      <div className="mt-8">
        <CreateActivityForm meetingId={meetingId} />
      </div>
    </main>
  );
}
