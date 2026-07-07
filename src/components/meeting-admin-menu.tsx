"use client";

import { MoreHorizontal, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteMeetingButton } from "@/components/delete-meeting-button";

export function MeetingAdminMenu({ meetingId }: { meetingId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label="경기 관리 메뉴 열기"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-secondary shadow-soft transition hover:bg-surfaceAlt"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <MoreHorizontal size={21} />
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-black/35 px-3 py-4 sm:place-items-center" role="dialog" aria-modal="true">
          <section className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-muted">관리 메뉴</p>
                <h2 className="mt-1 text-lg font-bold">경기 설정</h2>
              </div>
              <button
                aria-label="경기 관리 메뉴 닫기"
                className="grid size-9 place-items-center rounded-lg bg-surfaceAlt text-secondary"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-4 text-sm font-bold text-secondary transition hover:bg-line"
                href={`/meetings/${meetingId}/edit`}
              >
                <Pencil size={16} />
                경기 수정
              </Link>
              <div className="border-t border-line pt-2">
                <DeleteMeetingButton meetingId={meetingId} redirectTo="/" />
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
