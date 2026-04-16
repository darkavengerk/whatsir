"use client";

import { useEffect, useState } from "react";

export function InviteLinkBox({ token }: { token: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 브라우저에서만 원본 주소를 확인할 수 있어 hydration 뒤에 주입한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}/join/${token}` : `.../join/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* no-op */
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs dark:border-neutral-800 dark:bg-neutral-900">
      <code className="flex-1 truncate">{url}</code>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}
