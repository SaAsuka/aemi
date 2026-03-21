import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aemi | 案件マッチングプラットフォーム",
  description:
    "モデル・タレントのための案件マッチングプラットフォーム。月額¥4,000で案件が届き続ける。",
  openGraph: {
    title: "aemi | 案件マッチングプラットフォーム",
    description:
      "モデル・タレントのための案件マッチングプラットフォーム。",
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
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
