"use client";

import { useEffect, useTransition, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePageLoading } from "@/components/page-loading-provider";

export function InlineSpinner({ className = "" }: { className?: string }) {
  return <Loader2 aria-hidden="true" className={`shrink-0 animate-spin ${className}`} size={16} />;
}

export function PendingButtonContent({
  children,
  pending,
  pendingLabel = "처리 중"
}: {
  children: ReactNode;
  pending: boolean;
  pendingLabel?: string;
}) {
  return pending ? (
    <>
      <InlineSpinner />
      <span>{pendingLabel}</span>
    </>
  ) : (
    <>{children}</>
  );
}

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function SubmitButton({ children, className = "", pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const { showPageLoading, hidePageLoading } = usePageLoading();

  useEffect(() => {
    if (pending) {
      showPageLoading();
      return;
    }

    hidePageLoading();
  }, [hidePageLoading, pending, showPageLoading]);

  return (
    <button
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled || pending}
      type="submit"
      {...props}
    >
      {children}
    </button>
  );
}

type RoutePendingLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  pendingLabel?: string;
};

export function RoutePendingLink({
  children,
  className = "",
  href,
  onClick,
  pendingLabel = "이동 중",
  ...props
}: RoutePendingLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showPageLoading, hidePageLoading } = usePageLoading();

  useEffect(() => {
    if (!isPending) {
      hidePageLoading();
    }
  }, [hidePageLoading, isPending]);

  return (
    <a
      aria-busy={isPending}
      className={`${className} ${isPending ? "pointer-events-none opacity-75" : ""}`}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target
        ) {
          return;
        }

        event.preventDefault();
        showPageLoading();
        startTransition(() => {
          router.push(href);
        });
      }}
      {...props}
    >
      {children}
    </a>
  );
}
