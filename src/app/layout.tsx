import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingProvider } from "@/components/page-loading-provider";
import { AppQueryProvider } from "@/components/query-provider";
import { RouteQueryInvalidator } from "@/components/route-query-invalidator";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoIja",
  description: "축구/풋살 동호회 운영 SaaS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppQueryProvider>
          <PageLoadingProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <RouteQueryInvalidator />
              </Suspense>
              {children}
            </ToastProvider>
          </PageLoadingProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
