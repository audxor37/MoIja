import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
