"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastTone = "success" | "error";
type ToastInput = {
  message: string;
  tone?: ToastTone;
};
type ToastState = Required<ToastInput> & {
  id: number;
};

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(({ message, tone = "success" }: ToastInput) => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const contextValue = useMemo(() => showToast, [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        {toast ? (
          <div
            className={`w-full max-w-md rounded-xl border px-4 py-3 text-sm font-bold shadow-card transition ${
              toast.tone === "success"
                ? "border-[#BEE7C8] bg-[#F0FBF3] text-primary"
                : "border-[#FBD6A3] bg-[#FFF7E8] text-[#8A5200]"
            }`}
            role="status"
          >
            {toast.message}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);

  if (!showToast) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return showToast;
}
