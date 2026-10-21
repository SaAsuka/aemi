import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireTalent } from "@/lib/auth"
import { getTalentByToken } from "@/lib/actions/talent"
import { getOpenJobs } from "@/lib/actions/job"
import { matchTalentToJob, type MatchStatus, type UnmatchReason } from "@/lib/utils/job-matching"
import { TalentJobList } from "@/components/talent-job-list"
import { TalentNav } from "@/components/talent-nav"

export type JobWithMatch = Awaited<ReturnType<typeof getOpenJobs>>[number] & {
  matchStatus: MatchStatus
  unmatchReasons: UnmatchReason[]
}

export const metadata: Metadata = {
  title: "案件一覧 | VOZEL",
}

export default async function TalentJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams

  let talent: { id: string; name: string; status: string; gender: string | null; birthDate: Date | null; height: number | null }

  if (t) {
    const tokenTalent = await getTalentByToken(t)
    if (!tokenTalent || tokenTalent.status !== "ACTIVE") redirect("/auth/login")
    talent = tokenTalent
  } else {
    const sessionTalent = await requireTalent()
    talent = sessionTalent
  }

  const displayName = talent.name

  const jobs = await getOpenJobs()

  const jobsWithMatch: JobWithMatch[] = jobs.map((job) => {
    const { matchStatus, unmatchReasons } = matchTalentToJob(talent, job)
    return { ...job, matchStatus, unmatchReasons }
  })

  const matchCount = jobsWithMatch.filter((j) => j.matchStatus === "match").length

  return (
    <div className="min-h-[100dvh] bg-white">
      {!t && <TalentNav talentName={displayName} />}
      <main className="mx-auto max-w-7xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 text-neutral-950 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight">案件一覧</h1>
        <div className="mt-2">
          <TalentJobList jobs={jobsWithMatch} token={t || ""} matchCount={matchCount} />
        </div>
      </main>
    </div>
  )
}
