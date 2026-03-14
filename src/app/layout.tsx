import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aemi | 業務DXコンサルティング",
  description:
    "業務フローの可視化から自動化まで。LINE・Instagram連携、スケジュール管理、請求書自動化であなたのビジネスを加速します。",
  openGraph: {
    title: "aemi | 業務DXコンサルティング",
    description:
      "業務フローの可視化から自動化まで。あなたのビジネスを加速します。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
