import { calcAge } from "./date"

export type MatchStatus = "match" | "partial" | "unmatch"

export type UnmatchReason = {
  field: "gender" | "age" | "height"
  label: string
}

type TalentProfile = {
  gender: string | null
  birthDate: Date | null
  height: number | null
}

type JobConditions = {
  genderReq: string | null
  ageMin: number | null
  ageMax: number | null
  heightMin: number | null
  heightMax: number | null
}

export function matchTalentToJob(
  talent: TalentProfile,
  job: JobConditions,
): { matchStatus: MatchStatus; unmatchReasons: UnmatchReason[] } {
  const reasons: UnmatchReason[] = []
  let hasUnknown = false

  if (job.genderReq) {
    if (!talent.gender) {
      hasUnknown = true
    } else if (talent.gender !== job.genderReq) {
      reasons.push({ field: "gender", label: "性別不一致" })
    }
  }

  const talentAge = talent.birthDate ? calcAge(talent.birthDate) : null

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

  return { matchStatus, unmatchReasons: reasons }
}
