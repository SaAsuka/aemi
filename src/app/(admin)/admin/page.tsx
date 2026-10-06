import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight, Check, ChevronRight } from "lucide-react"
import { prisma } from "@/lib/db"
import { MonthlyApplicationChart } from "@/components/admin/monthly-application-chart"
import { MonthlyJobChart } from "@/components/admin/monthly-job-chart"
import { MonthlyAcceptRateChart } from "@/components/admin/monthly-accept-rate-chart"

const PANEL = "rounded-xl border border-neutral-200 bg-white"
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"

const STATUS_TONE = {
  blue: { chip: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  red: { chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  yellow: { chip: "bg-yellow-50 text-yellow-800", dot: "bg-yellow-500" },
} as const

function getJstNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
}

function getMonthRange(year: number, month: number) {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`)
  return { start, end }
}

// 日本時間の「YYYY-MM-DD」（サーバーがUTCでも日付がずれないように）
function jstDateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date)
}

// 最近の応募の日付：今日・昨日は言葉で、それ以外は「10月3日」
function formatAppliedAt(date: Date) {
  const now = new Date()
  const key = jstDateKey(date)
  if (key === jstDateKey(now)) {
    const time = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
    return `今日 ${time}`
  }
  if (key === jstDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "昨日"
  const sameYear = key.slice(0, 4) === jstDateKey(now).slice(0, 4)
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: sameYear ? undefined : "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function SectionHeading({
  id,
  title,
  note,
  link,
}: {
  id: string
  title: string
  note?: string
  link?: { href: string; label: string }
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="flex items-baseline gap-2">
        <h2 id={id} className="text-sm font-semibold text-neutral-950">
          {title}
        </h2>
        {note && <span className="text-xs text-neutral-500">{note}</span>}
      </div>
      {link && (
        <Link
          href={link.href}
          className={`-my-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 ${FOCUS}`}
        >
          {link.label}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

async function DashboardStats() {
  const jstNow = getJstNow()
  const { start: monthStart, end: monthEnd } = getMonthRange(jstNow.getFullYear(), jstNow.getMonth() + 1)

  const [monthlyTalents, monthlyJobs, openJobs, monthlyApplications, monthlyAccepted, monthlyInvoices] =
    await Promise.all([
      prisma.talent.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
      prisma.job.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.application.count({ where: { appliedAt: { gte: monthStart, lt: monthEnd } } }),
      prisma.application.count({
        where: {
          status: "ACCEPTED",
          decidedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.invoice.findMany({
        where: {
          status: { not: "CANCELLED" },
          issueDate: { gte: monthStart, lt: monthEnd },
        },
        select: { amount: true, taxRate: true },
      }),
    ])

  const monthlyInvoiceTotal = monthlyInvoices.reduce(
    (sum, inv) => sum + inv.amount + Math.floor(inv.amount * inv.taxRate / 100),
    0
  )

  const stats: { label: string; value: string; unit?: string; sub?: string; href: string }[] = [
    { label: "新規タレント", value: monthlyTalents.toLocaleString(), unit: "名", href: "/admin/talents" },
    {
      label: "新規案件",
      value: monthlyJobs.toLocaleString(),
      unit: "件",
      sub: `現在の募集中 ${openJobs.toLocaleString()}件`,
      href: "/admin/jobs",
    },
    { label: "応募", value: monthlyApplications.toLocaleString(), unit: "件", href: "/admin/applications" },
    { label: "合格", value: monthlyAccepted.toLocaleString(), unit: "件", href: "/admin/applications?status=ACCEPTED" },
    { label: "請求額（税込）", value: `¥${monthlyInvoiceTotal.toLocaleString()}`, href: "/admin/invoices" },
  ]

  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, i) => (
        <li key={stat.label} className={i === stats.length - 1 ? "col-span-2 xl:col-span-1" : ""}>
          <Link
            href={stat.href}
            className={`group relative flex h-full flex-col bg-white px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-5 sm:py-5 ${FOCUS} focus-visible:ring-inset`}
          >
            <span className="pr-5 text-xs text-neutral-500 sm:text-sm">{stat.label}</span>
            <span className="mt-2 flex items-baseline gap-1">
              <span className="break-all text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                {stat.value}
              </span>
              {stat.unit && <span className="text-sm text-neutral-500">{stat.unit}</span>}
            </span>
            {stat.sub && <span className="mt-1 text-xs text-neutral-500">{stat.sub}</span>}
            <ChevronRight
              className="absolute right-3 top-4 size-4 text-neutral-300 transition-colors group-hover:text-neutral-950 sm:top-5"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

async function MonthlyCharts() {
  const jstNow = getJstNow()
  const months: { year: number; month: number; label: string; start: Date; end: Date }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(jstNow.getFullYear(), jstNow.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const { start, end } = getMonthRange(y, m)
    months.push({ year: y, month: m, label: `${m}月`, start, end })
  }

  const [applicationsByMonth, jobsByMonth, acceptedByMonth, totalByMonth] = await Promise.all([
    Promise.all(
      months.map(async (m) => {
        const [applied, resumeSent, accepted, rejected] = await Promise.all([
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: "APPLIED" } }),
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: "RESUME_SENT" } }),
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: "ACCEPTED" } }),
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: { in: ["REJECTED", "AUTO_REJECTED"] } } }),
        ])
        return { label: m.label, 応募中: applied, 書類送付済: resumeSent, 合格: accepted, 不合格: rejected }
      })
    ),
    Promise.all(
      months.map(async (m) => {
        const count = await prisma.job.count({ where: { createdAt: { gte: m.start, lt: m.end } } })
        return { label: m.label, 案件数: count }
      })
    ),
    Promise.all(
      months.map(async (m) => {
        const accepted = await prisma.application.count({ where: { decidedAt: { gte: m.start, lt: m.end }, status: "ACCEPTED" } })
        const decided = await prisma.application.count({ where: { decidedAt: { gte: m.start, lt: m.end }, status: { in: ["ACCEPTED", "REJECTED", "AUTO_REJECTED"] } } })
        return { label: m.label, 合格率: decided > 0 ? Math.round((accepted / decided) * 100) : 0 }
      })
    ),
    Promise.all(
      months.map(async (m) => {
        const count = await prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end } } })
        return { label: m.label, total: count }
      })
    ),
  ])

  const applicationData = applicationsByMonth.map((d, i) => ({
    ...d,
    合計: totalByMonth[i].total,
  }))

  return (
    <div className="space-y-4">
      <div className={`${PANEL} p-4 sm:p-5`}>
        <h3 className="text-sm font-medium text-neutral-950">応募数</h3>
        <p className="mb-4 mt-1 text-xs text-neutral-500">応募した月ごとの件数と、いまの選考状況</p>
        <MonthlyApplicationChart data={applicationData} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`${PANEL} p-4 sm:p-5`}>
          <h3 className="text-sm font-medium text-neutral-950">新規案件数</h3>
          <p className="mb-4 mt-1 text-xs text-neutral-500">登録した月ごとの案件数</p>
          <MonthlyJobChart data={jobsByMonth} />
        </div>
        <div className={`${PANEL} p-4 sm:p-5`}>
          <h3 className="text-sm font-medium text-neutral-950">合格率</h3>
          <p className="mb-4 mt-1 text-xs text-neutral-500">合否が決まった応募のうち、合格した割合</p>
          <MonthlyAcceptRateChart data={acceptedByMonth} />
        </div>
      </div>
    </div>
  )
}

async function RecentApplications() {
  const recentApplications = await prisma.application.findMany({
    take: 5,
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      appliedAt: true,
      talent: { select: { name: true } },
      job: { select: { title: true } },
    },
  })

  return (
    <div className={PANEL}>
      {recentApplications.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-neutral-500">まだ応募はありません</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {recentApplications.map((app) => (
            <li key={app.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-950">{app.talent.name}</p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">{app.job.title}</p>
              </div>
              <time
                dateTime={app.appliedAt.toISOString()}
                className="shrink-0 text-xs tabular-nums text-neutral-500"
              >
                {formatAppliedAt(app.appliedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

async function PendingActions() {
  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const [appliedCount, deadlineSoonCount, resumeSentCount] = await Promise.all([
    prisma.application.count({ where: { status: "APPLIED" } }),
    prisma.job.count({
      where: {
        status: "OPEN",
        deadline: { lte: threeDaysLater },
      },
    }),
    prisma.application.count({ where: { status: "RESUME_SENT" } }),
  ])

  // tone：件数があるときの状態ラベルの色（青＝確認待ち・赤＝締切が近い・黄＝送付待ち）
  const items = [
    {
      label: "未確認の応募",
      count: appliedCount,
      href: "/admin/applications?status=APPLIED",
      status: "確認待ち",
      tone: "blue",
    },
    {
      label: "締切3日以内の案件",
      count: deadlineSoonCount,
      href: "/admin/jobs?status=OPEN",
      status: "締切間近",
      tone: "red",
    },
    {
      label: "書類送付待ち",
      count: resumeSentCount,
      href: "/admin/applications?status=RESUME_SENT",
      status: "送付待ち",
      tone: "yellow",
    },
  ] as const

  return (
    <ul className="grid gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
      {items.map((item) => {
        const needsAction = item.count > 0
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`group relative flex h-full flex-col bg-white px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-5 sm:py-5 ${FOCUS} focus-visible:ring-inset`}
            >
              <span className="pr-5 text-sm text-neutral-600">{item.label}</span>
              <span className="mt-2 flex items-baseline gap-1">
                <span
                  className={`text-3xl font-semibold tracking-tight ${
                    needsAction ? "text-neutral-950" : "text-neutral-300"
                  }`}
                >
                  {item.count.toLocaleString()}
                </span>
                <span className={`text-sm ${needsAction ? "text-neutral-500" : "text-neutral-300"}`}>件</span>
              </span>
              <span className="mt-3">
                {needsAction ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[item.tone].chip}`}
                  >
                    <span className={`size-1.5 rounded-full ${STATUS_TONE[item.tone].dot}`} aria-hidden="true" />
                    {item.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 py-1 text-xs text-neutral-500">
                    <Check className="size-3.5 text-green-600" aria-hidden="true" />
                    対応なし
                  </span>
                )}
              </span>
              <ChevronRight
                className="absolute right-3 top-4 size-4 text-neutral-300 transition-colors group-hover:text-neutral-950 sm:top-5"
                aria-hidden="true"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`bg-white px-4 py-4 sm:px-5 sm:py-5 ${i === 4 ? "col-span-2 xl:col-span-1" : ""}`}>
          <Bone className="h-4 w-20" />
          <Bone className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

function PendingSkeleton() {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white px-4 py-4 sm:px-5 sm:py-5">
          <Bone className="h-4 w-28" />
          <Bone className="mt-3 h-8 w-12" />
          <Bone className="mt-4 h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className={`${PANEL} p-4 sm:p-5`}>
        <Bone className="h-4 w-24" />
        <Bone className="mt-6 h-[250px] w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`${PANEL} p-4 sm:p-5`}>
            <Bone className="h-4 w-24" />
            <Bone className="mt-6 h-[200px] w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentSkeleton() {
  return (
    <div className={`${PANEL} divide-y divide-neutral-100`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3.5 sm:px-5">
          <div className="space-y-2">
            <Bone className="h-4 w-28" />
            <Bone className="h-3 w-44" />
          </div>
          <Bone className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const jstNow = getJstNow()
  const today = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date())

  return (
    <div className="space-y-8 pb-4 sm:space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">ダッシュボード</h1>
        <p className="mt-1 text-sm text-neutral-500">{today}</p>
      </div>

      <section aria-labelledby="pending-heading">
        <SectionHeading id="pending-heading" title="対応が必要なこと" />
        <Suspense fallback={<PendingSkeleton />}>
          <PendingActions />
        </Suspense>
      </section>

      <section aria-labelledby="stats-heading">
        <SectionHeading id="stats-heading" title="今月の実績" note={`${jstNow.getMonth() + 1}月1日〜今日`} />
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats />
        </Suspense>
      </section>

      <section aria-labelledby="recent-heading">
        <SectionHeading
          id="recent-heading"
          title="最近の応募"
          link={{ href: "/admin/applications", label: "すべての応募を見る" }}
        />
        <Suspense fallback={<RecentSkeleton />}>
          <RecentApplications />
        </Suspense>
      </section>

      <section aria-labelledby="charts-heading">
        <SectionHeading id="charts-heading" title="推移" note="過去6か月" />
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyCharts />
        </Suspense>
      </section>
    </div>
  )
}
