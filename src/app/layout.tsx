import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// 端末ごとのフォント（ヒラギノ・游ゴシック・Android の標準など）に任せず、どこでも同じゴシック体で表示する。
// フォントのファイルは文字の範囲ごとに分かれていて、画面で使う文字のぶんだけ読み込む（全部を一度に読み込むことはない）
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VOZEL | 案件マッチングプラットフォーム",
  description:
    "モデル・タレントのための案件マッチングプラットフォーム。月額¥4,000で案件が届き続ける。",
  openGraph: {
    title: "VOZEL | 案件マッチングプラットフォーム",
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
    <html lang="ja" className={notoSansJp.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
