"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyState = "idle" | "copied" | "error";

export function InviteCodeCopyButton({ inviteCode }: { inviteCode: string | null }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const canCopy = Boolean(inviteCode);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  async function handleCopy() {
    if (!inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const label =
    copyState === "copied"
      ? "복사됨"
      : copyState === "error"
        ? "복사 실패"
        : inviteCode
          ? `초대 코드 ${inviteCode}`
          : "참가 링크";

  return (
    <button
      aria-live="polite"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E8F3FF] px-4 text-sm font-semibold text-strategy transition hover:bg-[#DBEAFF] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!canCopy}
      onClick={handleCopy}
      title={inviteCode ? `초대 코드: ${inviteCode}` : "초대 코드가 아직 없습니다"}
      type="button"
    >
      {copyState === "copied" ? <Check size={18} /> : <Copy size={18} />}
      {label}
    </button>
  );
}
