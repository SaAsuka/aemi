import Link from "next/link"
import { ArrowRight, Building2, FileText } from "lucide-react"
import { prisma } from "@/lib/db"
import { FreeeConnectButton } from "@/components/admin/freee-connect-button"
import { FreeeResultNotice } from "@/components/admin/freee-result-notice"
import { StatusChip } from "@/components/admin/status-chip"
import { PANEL } from "@/components/admin/styles"

// freee と連携するとできること（未連携のときは「できないこと」として見せる）
const FREEE_USES = [
  { icon: FileText, title: "請求書の発行", desc: "応募管理の「請求書作成」から、freeeで請求書を発行します。", href: "/admin/invoices", link: "請求書管理" },
  {
    icon: Building2,
    title: "取引先の登録・取り込み",
    desc: "制作会社を登録するとfreeeの取引先にも追加され、freeeの取引先をまとめて取り込めます。",
    href: "/admin/production-companies",
    link: "制作会社管理",
  },
]

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ freee?: string }>
}) {
  const { freee } = await searchParams
  // 連携しているかどうかと、どの事業所につながっているか（中身の鍵は読まない）
  const token = await prisma.freeeToken.findFirst({ select: { companyId: true } })
  const connected = Boolean(token)

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">設定</h1>
        <p className="mt-1 text-sm text-neutral-500">外部サービスとの連携を設定します。</p>
      </div>

      {(freee === "connected" || freee === "error") && <FreeeResultNotice result={freee} />}

      <section aria-labelledby="freee-heading" className={PANEL}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="freee-heading" className="text-base font-semibold text-neutral-950">
                freee連携
              </h2>
              {connected ? (
                <StatusChip tone="green" label="連携済み" />
              ) : (
                <span className="inline-flex h-6 items-center rounded-full border border-neutral-300 px-2.5 text-xs text-neutral-500">未連携</span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              {connected ? (
                <>
                  会計ソフトのfreeeとつながっています。
                  <span className="inline-block tabular-nums">事業所ID {token!.companyId}</span>
                </>
              ) : (
                "会計ソフトのfreeeとつなぐと、請求書を発行できるようになります。"
              )}
            </p>
          </div>
          <FreeeConnectButton connected={connected} className="h-10 w-full shrink-0 sm:h-9 sm:w-auto" />
        </div>

        <div className="border-t border-neutral-200 px-5 py-4 sm:px-6">
          <p className="text-xs font-medium text-neutral-500">{connected ? "連携して使えること" : "連携すると使えること"}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {FREEE_USES.map((u) => (
              <li key={u.title} className="flex gap-3 rounded-lg bg-neutral-50 p-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-neutral-200">
                  <u.icon className="size-4 text-neutral-700" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-neutral-950">{u.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{u.desc}</span>
                  {connected && (
                    <Link
                      href={u.href}
                      className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {u.link}へ
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-neutral-200 px-5 py-4 text-xs leading-relaxed text-neutral-500 sm:px-6">
          {connected ? (
            <>
              請求書が作れない・取引先を取り込めないなど、うまく動かないときは「freeeとつなぎ直す」を押してください。freeeのログイン画面に移り、「許可する」を押すと元の画面に戻ります。登録済みの請求書や制作会社は消えません。
            </>
          ) : (
            <>
              ボタンを押すとfreeeのログイン画面に移ります。freeeにログインして「許可する」を押すと、この画面に戻って連携が完了します。
            </>
          )}
        </div>
      </section>
    </div>
  )
}
