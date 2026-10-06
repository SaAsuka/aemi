import { GenericPageSkeleton } from "@/components/admin/page-skeletons"

// ダッシュボードのほか、自分の仮表示を持たないページ（設定など）でも出るので、どのページにも合う形にしている
export default function AdminLoading() {
  return <GenericPageSkeleton />
}
