"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

export function HelpIcon({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label={`${title} 설명`}
        className="inline-grid size-6 place-items-center rounded-full bg-surfaceAlt text-muted transition hover:bg-line hover:text-ink"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Info size={14} />
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 px-3 py-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <section className="w-full max-w-sm rounded-2xl bg-white p-4 text-ink shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">{title}</h2>
              <button
                aria-label="도움말 닫기"
                className="grid size-9 place-items-center rounded-lg bg-surfaceAlt text-secondary"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-3 text-sm font-semibold leading-6 text-secondary">{children}</div>
          </section>
        </div>
      ) : null}
    </>
  );
}
