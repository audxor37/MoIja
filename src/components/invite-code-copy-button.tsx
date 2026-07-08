"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { InlineSpinner } from "@/components/pending-ui";
import { useToast } from "@/components/toast-provider";
import { buildInviteSharePayload } from "@/lib/match-cycle";

type CopyState = "idle" | "copied" | "error";

export function InviteCodeCopyButton({ inviteCode }: { inviteCode: string | null }) {
  const showToast = useToast();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [isPending, setIsPending] = useState(false);
  const canCopy = Boolean(inviteCode);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  async function handleShare() {
    if (!inviteCode) {
      return;
    }

    setIsPending(true);
    const payload = buildInviteSharePayload({
      inviteCode,
      siteUrl: window.location.origin
    });

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setCopyState("copied");
        showToast({ message: "초대 공유를 열었습니다." });
        return;
      }

      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      setCopyState("copied");
      showToast({ message: "공유가 제한된 환경이라 초대 내용을 복사했습니다." });
    } catch {
      setCopyState("error");
      showToast({ message: "초대 공유에 실패했습니다.", tone: "error" });
    } finally {
      setIsPending(false);
    }
  }

  const label =
    isPending
      ? "공유 준비 중"
      : copyState === "copied"
      ? "공유됨"
      : copyState === "error"
        ? "공유 실패"
        : inviteCode
          ? `초대 공유 ${inviteCode}`
          : "참가 링크";

  return (
    <button
      aria-live="polite"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E8F3FF] px-4 text-sm font-semibold text-strategy transition hover:bg-[#DBEAFF] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!canCopy || isPending}
      onClick={handleShare}
      title={inviteCode ? `초대 코드: ${inviteCode}` : "초대 코드가 아직 없습니다"}
      type="button"
    >
      {isPending ? <InlineSpinner /> : copyState === "copied" ? <Check size={18} /> : <Share2 size={18} />}
      {label}
    </button>
  );
}
