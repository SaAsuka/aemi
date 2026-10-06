import type { Metadata } from "next"
import { NotFoundView } from "@/components/not-found-view"

export const metadata: Metadata = {
  title: "ページが見つかりません",
}

export default function NotFound() {
  return <NotFoundView />
}
