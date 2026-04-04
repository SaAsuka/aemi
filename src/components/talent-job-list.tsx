"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { GENDER_LABELS } from "@/types"
import type { JobWithMatch } from "@/app/(talent)/jobs/page"

type FilterType = "all" | "match" | "unmatch"
type SortType = "newest" | "deadline" | "fee"

function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return `${d.getMonth() + 1}/${d.getDate()}`
}

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
  const [filter, setFilter] = useState<FilterType>("all")
  const [sort, setSort] = useState<SortType>("newest")

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
    return <p className="text-muted-foreground text-center py-12">現在募集中の案件はありません</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="all">全件</option>
          <option value="match">マッチのみ</option>
          <option value="unmatch">条件外含む</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
        >
          <option value="newest">新着順</option>
          <option value="deadline">締切が近い順</option>
          <option value="fee">報酬が高い順</option>
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {matchCount}件マッチ / 全{jobs.length}件
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}?t=${token}`}
            className="block rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {isNewJob(job.createdAt) && (
                  <Badge className="bg-blue-500 text-white">NEW</Badge>
                )}
                <h2 className="font-semibold">{job.title}</h2>
              </div>
              <MatchBadge status={job.matchStatus} />
            </div>

            <p className="text-sm text-muted-foreground mt-1">{job.client.companyName}</p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {job.location && <span>📍 {job.location}</span>}
              {job.fee != null && <span>💰 ¥{job.fee.toLocaleString()}</span>}
              {job.deadline && (
                <span>
                  📅 締切: {formatShortDate(job.deadline)}
                  {isWithinDays(job.deadline, 3) && (
                    <Badge variant="destructive" className="ml-1 text-xs">まもなく</Badge>
                  )}
                </span>
              )}
            </div>

            {(job.startsAt || job.endsAt) && (
              <p className="text-sm text-muted-foreground mt-1">
                期間: {job.startsAt ? formatShortDate(job.startsAt) : "−"} 〜{" "}
                {job.endsAt ? formatShortDate(job.endsAt) : "−"}
              </p>
            )}

            <JobConditions job={job} />
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-8">該当する案件がありません</p>
      )}
    </div>
  )
}

function MatchBadge({ status }: { status: "match" | "partial" | "unmatch" }) {
  if (status === "match") {
    return <Badge className="bg-green-100 text-green-800 shrink-0">マッチ</Badge>
  }
  if (status === "partial") {
    return <Badge className="bg-yellow-100 text-yellow-800 shrink-0">条件確認</Badge>
  }
  return <Badge className="bg-red-100 text-red-800 shrink-0">アンマッチ</Badge>
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
    <div className="mt-2 text-sm">
      {parts.length > 0 && (
        <p className="text-muted-foreground">条件: {parts.join(" / ")}</p>
      )}
      {job.unmatchReasons.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {job.unmatchReasons.map((r) => (
            <span key={r.field} className="text-red-600 text-xs">
              ⚠ {r.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
