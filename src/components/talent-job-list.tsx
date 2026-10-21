"use client"

import { useState, useMemo, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Banknote, Briefcase, CalendarClock, ChevronDown, MapPin, RefreshCw } from "lucide-react"
import { StatusChip } from "@/components/admin/status-chip"
import { GENDER_LABELS } from "@/types"
import type { JobWithMatch } from "@/app/(talent)/jobs/page"
import { readJobListReturn, saveJobListReturn, clearJobListReturn } from "@/lib/job-list-return"

type FilterType = "all" | "match" | "unmatch"
type SortType = "newest" | "deadline" | "fee"

const FILTERS: FilterType[] = ["all", "match", "unmatch"]
const FILTER_LABELS: Record<FilterType, string> = { all: "全件", match: "マッチのみ", unmatch: "条件外含む" }
const SORTS: SortType[] = ["newest", "deadline", "fee"]

import { formatShortDeadline } from "@/lib/utils/date"

function isWithinDays(date: Date | string, days: number): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

function isNewJob(createdAt: Date | string): boolean {
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return diff <= 3 * 24 * 60 * 60 * 1000
}

export function TalentJobList({
  jobs,
  token,
  matchCount,
}: {
  jobs: JobWithMatch[]
  token: string
  matchCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // 絞り込み・並び順はURLに持たせる（案件を見て戻っても、そのままになるように）
  const filterParam = searchParams.get("filter") as FilterType | null
  const sortParam = searchParams.get("sort") as SortType | null
  const [filter, setFilter] = useState<FilterType>(filterParam && FILTERS.includes(filterParam) ? filterParam : "all")
  const [sort, setSort] = useState<SortType>(sortParam && SORTS.includes(sortParam) ? sortParam : "newest")
  const [refreshing, setRefreshing] = useState(false)

  const updateUrl = (next: { filter: FilterType; sort: SortType }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.filter === "all") params.delete("filter")
    else params.set("filter", next.filter)
    if (next.sort === "newest") params.delete("sort")
    else params.set("sort", next.sort)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // 案件ページから戻ってきたら、見ていた位置までスクロールする
  useEffect(() => {
    const saved = readJobListReturn()
    if (!saved) return
    const here = `${window.location.pathname}${window.location.search}`
    if (saved.url !== here) return
    clearJobListReturn()
    requestAnimationFrame(() => window.scrollTo(0, saved.scrollY))
  }, [])

  const rememberPosition = () => {
    saveJobListReturn({ url: `${window.location.pathname}${window.location.search}`, scrollY: window.scrollY })
  }

  const filtered = useMemo(() => {
    let result = jobs
    if (filter === "match") {
      result = result.filter((j) => j.matchStatus === "match")
    } else if (filter === "unmatch") {
      result = result.filter((j) => j.matchStatus !== "match")
    }

    result = [...result].sort((a, b) => {
      if (sort === "deadline") {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (sort === "fee") {
        return (b.fee ?? 0) - (a.fee ?? 0)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [jobs, filter, sort])

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-300 px-4 py-14 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
          <Briefcase className="size-5 text-neutral-500" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm text-neutral-500">現在募集中の案件はありません</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-neutral-500">
        <span className="font-semibold tabular-nums text-neutral-950">{matchCount}</span>件マッチ
        <span className="mx-1.5 text-neutral-300">/</span>
        全<span className="tabular-nums">{jobs.length}</span>件
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* 絞り込み：3つから選ぶので、押して切り替えるボタンにする */}
        <div role="radiogroup" aria-label="絞り込み" className="inline-flex rounded-lg bg-neutral-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => {
                setFilter(f)
                updateUrl({ filter: f, sort })
              }}
              className={`h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
                filter === f ? "bg-white font-medium text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => {
              const next = e.target.value as SortType
              setSort(next)
              updateUrl({ filter, sort: next })
            }}
            aria-label="並び順"
            className="h-10 appearance-none rounded-lg border border-neutral-300 bg-white pl-3 pr-9 text-base text-neutral-950 outline-none transition-colors hover:border-neutral-400 focus-visible:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10 sm:text-sm"
          >
            <option value="newest">新着順</option>
            <option value="deadline">締切が近い順</option>
            <option value="fee">報酬が高い順</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={async () => {
            setRefreshing(true)
            router.refresh()
            setTimeout(() => setRefreshing(false), 1000)
          }}
          className="ml-auto flex size-10 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
          title="最新情報に更新"
          aria-label="最新情報に更新"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {filtered.map((job) => (
          <li key={job.id}>
            <Link
              href={`/jobs/${job.id}?t=${token}`}
              onClick={rememberPosition}
              className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-4 transition-[border-color,background-color,transform] duration-150 hover:border-neutral-300 hover:bg-neutral-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 active:scale-[0.99] sm:p-5"
            >
              <div className="flex items-center gap-1.5">
                <MatchBadge status={job.matchStatus} />
                {isNewJob(job.createdAt) && <StatusChip tone="blue" label="NEW" />}
              </div>

              <h2 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-950">{job.title}</h2>
              <p className="mt-1 truncate text-sm text-neutral-500">{job.client.companyName}</p>

              <dl className="mt-4 space-y-1.5 text-sm text-neutral-700">
                {job.location && (
                  <div className="flex items-start gap-2">
                    <dt className="sr-only">場所</dt>
                    <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    <dd className="min-w-0">{job.location}</dd>
                  </div>
                )}
                {job.fee != null && (
                  <div className="flex items-start gap-2">
                    <dt className="sr-only">報酬</dt>
                    <Banknote className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    <dd className="font-medium tabular-nums text-neutral-950">¥{job.fee.toLocaleString()}</dd>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">締切</dt>
                    <CalendarClock className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    <dd className="flex items-center gap-1.5">
                      締切: <span className="tabular-nums">{formatShortDeadline(job.deadline)}</span>
                      {isWithinDays(job.deadline, 3) && (
                        <span className="inline-flex h-5 items-center rounded-full bg-red-600 px-2 text-[11px] font-medium text-white">まもなく</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              <JobConditions job={job} />
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-500">該当する案件がありません</p>
      )}
    </div>
  )
}

function MatchBadge({ status }: { status: "match" | "partial" | "unmatch" }) {
  if (status === "match") {
    return <StatusChip tone="green" label="マッチ" />
  }
  if (status === "partial") {
    return <StatusChip tone="yellow" label="条件確認" />
  }
  return <StatusChip tone="red" label="アンマッチ" />
}

function JobConditions({ job }: { job: JobWithMatch }) {
  const parts: string[] = []
  if (job.genderReq) parts.push(GENDER_LABELS[job.genderReq] ?? job.genderReq)
  if (job.ageMin != null || job.ageMax != null) {
    parts.push(`${job.ageMin ?? "−"}〜${job.ageMax ?? "−"}歳`)
  }
  if (job.heightMin != null || job.heightMax != null) {
    parts.push(`${job.heightMin ?? "−"}〜${job.heightMax ?? "−"}cm`)
  }

  if (parts.length === 0 && job.unmatchReasons.length === 0) return null

  return (
    <div className="mt-auto pt-4">
      <div className="border-t border-neutral-100 pt-3 text-sm">
        {parts.length > 0 && (
          <p className="text-neutral-500">条件: {parts.join(" / ")}</p>
        )}
        {job.unmatchReasons.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {job.unmatchReasons.map((r) => (
              <li key={r.field} className="flex items-start gap-1.5 text-xs text-red-600">
                <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {r.detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
