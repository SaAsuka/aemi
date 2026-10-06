import { FormPageSkeleton } from "@/components/admin/page-skeletons"

// 一覧の仮表示が出ないよう、新規作成ページ用の仮表示を持つ
export default function NewPageLoading() {
  return <FormPageSkeleton />
}
