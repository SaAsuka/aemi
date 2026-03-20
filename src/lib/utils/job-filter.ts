import { calcAge } from "./date"
import type { Gender } from "@/generated/prisma/client"

type TalentForFilter = {
  gender: Gender | null
  birthDate: Date | null
  height: number | null
}

type JobFilter = {
  genderReq: Gender | null
  ageMin: number | null
  ageMax: number | null
  heightMin: number | null
  heightMax: number | null
}

export function matchesTalent(filter: JobFilter, talent: TalentForFilter): boolean {
  if (filter.genderReq && talent.gender && filter.genderReq !== talent.gender) {
    return false
  }

  if (talent.birthDate && (filter.ageMin || filter.ageMax)) {
    const age = calcAge(talent.birthDate)
    if (filter.ageMin && age < filter.ageMin) return false
    if (filter.ageMax && age > filter.ageMax) return false
  }

  if (talent.height && (filter.heightMin || filter.heightMax)) {
    if (filter.heightMin && talent.height < filter.heightMin) return false
    if (filter.heightMax && talent.height > filter.heightMax) return false
  }

  return true
}
