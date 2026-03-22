import { notFound } from "next/navigation"
import { getTalentByToken } from "@/lib/actions/talent"
import { getOpenJobs } from "@/lib/actions/job"
import { calcAge } from "@/lib/utils/date"
import { TalentJobList } from "@/components/talent-job-list"

type MatchStatus = "match" | "partial" | "unmatch"

type UnmatchReason = {
  field: "gender" | "age" | "height"
  label: string
}

export type JobWithMatch = Awaited<ReturnType<typeof getOpenJobs>>[number] & {
  matchStatus: MatchStatus
  unmatchReasons: UnmatchReason[]
}

export default async function TalentJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams
  if (!t) notFound()

  const talent = await getTalentByToken(t)
  if (!talent || talent.status !== "ACTIVE") notFound()

  const jobs = await getOpenJobs()

  const talentAge = talent.birthDate ? calcAge(talent.birthDate) : null

  const jobsWithMatch: JobWithMatch[] = jobs.map((job) => {
    const reasons: UnmatchReason[] = []
    let hasUnknown = false

    if (job.genderReq) {
      if (!talent.gender) {
        hasUnknown = true
      } else if (talent.gender !== job.genderReq) {
        reasons.push({ field: "gender", label: "性別不一致" })
      }
    }

    if (job.ageMin != null || job.ageMax != null) {
      if (talentAge == null) {
        hasUnknown = true
      } else {
        if (job.ageMin != null && talentAge < job.ageMin) {
          reasons.push({ field: "age", label: "年齢条件外" })
        } else if (job.ageMax != null && talentAge > job.ageMax) {
          reasons.push({ field: "age", label: "年齢条件外" })
        }
      }
    }

    if (job.heightMin != null || job.heightMax != null) {
      if (talent.height == null) {
        hasUnknown = true
      } else {
        if (job.heightMin != null && talent.height < job.heightMin) {
          reasons.push({ field: "height", label: "身長条件外" })
        } else if (job.heightMax != null && talent.height > job.heightMax) {
          reasons.push({ field: "height", label: "身長条件外" })
        }
      }
    }

    let matchStatus: MatchStatus
    if (reasons.length > 0) {
      matchStatus = "unmatch"
    } else if (hasUnknown) {
      matchStatus = "partial"
    } else {
      matchStatus = "match"
    }

    return { ...job, matchStatus, unmatchReasons: reasons }
  })

  const matchCount = jobsWithMatch.filter((j) => j.matchStatus === "match").length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold">{talent.name}さんの案件一覧</h1>
      <TalentJobList jobs={jobsWithMatch} token={t} matchCount={matchCount} />
    </div>
  )
}
