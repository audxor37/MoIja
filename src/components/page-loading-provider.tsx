"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";

type PageLoadingContextValue = {
  showPageLoading: () => void;
  hidePageLoading: () => void;
};

const PageLoadingContext = createContext<PageLoadingContextValue | null>(null);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const showPageLoading = useCallback(() => setIsLoading(true), []);
  const hidePageLoading = useCallback(() => setIsLoading(false), []);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const value = useMemo(
    () => ({
      showPageLoading,
      hidePageLoading
    }),
    [hidePageLoading, showPageLoading]
  );

  return (
    <PageLoadingContext.Provider value={value}>
      {children}
      {isLoading ? (
        <div
          aria-live="polite"
          aria-label="화면을 불러오는 중"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/35 backdrop-blur-[2px]"
          role="status"
        >
          <div className="grid min-w-36 place-items-center gap-3 rounded-2xl border border-white/40 bg-white/95 px-5 py-4 shadow-card">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-primary" />
            <span className="text-sm font-bold text-primaryText">불러오는 중</span>
          </div>
        </div>
      ) : null}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext);

  if (!context) {
    return {
      showPageLoading: () => {},
      hidePageLoading: () => {}
    };
  }

  return context;
}
