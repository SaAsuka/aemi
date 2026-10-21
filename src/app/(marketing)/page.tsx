import { redirect } from "next/navigation"

// 紹介ページ（LP）は廃止。トップを開いた人はマイページへ送る
// （ログインしていなければ middleware がログイン画面へ回す）
export default function Home() {
  redirect("/mypage")
}
