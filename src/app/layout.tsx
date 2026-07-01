import type { Metadata } from "next";
import { Suspense } from "react";
import { AppQueryProvider } from "@/components/query-provider";
import { RouteQueryInvalidator } from "@/components/route-query-invalidator";
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
          <Suspense fallback={null}>
            <RouteQueryInvalidator />
          </Suspense>
          {children}
        </AppQueryProvider>
      </body>
    </html>
  );
}
