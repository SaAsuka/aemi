import { z } from "zod"

const parsedStatusEnum = z.enum(["ACCEPTED", "REJECTED", "PENDING"])
const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional()

export const parsedTalentEntrySchema = z.object({
  name: z.string().nullable().optional().transform((v) => v ?? ""),
  status: parsedStatusEnum.nullable().optional().transform((v) => v ?? "PENDING"),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export const parsedJobSchema = z.object({
  title: z.string().nullable().optional().transform((v) => v ?? ""),
  clientCompanyName: z.string().nullable().optional(),
  clientContactName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  fee: z.number().nullable().optional(),
  genderReq: genderEnum,
  ageMin: z.number().nullable().optional(),
  ageMax: z.number().nullable().optional(),
  heightMin: z.number().nullable().optional(),
  heightMax: z.number().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  dates: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  talents: z.array(parsedTalentEntrySchema).nullable().optional().transform((v) => v ?? []),
})

export type ParsedTalentEntry = z.infer<typeof parsedTalentEntrySchema>
export type ParsedJob = z.infer<typeof parsedJobSchema>

const VALID_DATE_TYPES = ["AUDITION", "SHOOTING", "OTHER"] as const
const VALID_REQUIREMENTS = ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"] as const

export const parsedJobDateSchema = z.object({
  type: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export const parsedCommonSchema = z.object({
  clientCompanyName: z.string().nullable().optional(),
  clientContactName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  dates: z.array(parsedJobDateSchema).nullable().optional().transform((v) =>
    (v ?? [])
      .filter((d) => d.date != null && VALID_DATE_TYPES.includes(d.type as typeof VALID_DATE_TYPES[number]))
      .map((d) => ({ ...d, type: d.type as typeof VALID_DATE_TYPES[number], date: d.date as string }))
  ),
  requirements: z.array(z.string()).nullable().optional().transform((v) =>
    (v ?? []).filter((r): r is typeof VALID_REQUIREMENTS[number] => VALID_REQUIREMENTS.includes(r as typeof VALID_REQUIREMENTS[number]))
  ),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export const parsedRoleSchema = z.object({
  title: z.string().nullable().optional().transform((v) => v ?? ""),
  genderReq: genderEnum,
  ageMin: z.number().nullable().optional(),
  ageMax: z.number().nullable().optional(),
  heightMin: z.number().nullable().optional(),
  heightMax: z.number().nullable().optional(),
  fee: z.number().nullable().optional(),
  capacity: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  talents: z.array(parsedTalentEntrySchema).nullable().optional().transform((v) => v ?? []),
})

export const parsedJobResponseSchema = z.object({
  common: parsedCommonSchema,
  roles: z.array(parsedRoleSchema).min(1),
})

export type ParsedCommon = z.infer<typeof parsedCommonSchema>
export type ParsedRole = z.infer<typeof parsedRoleSchema>

export type ParseResult = {
  common: ParsedCommon
  jobs: Array<{
    role: ParsedRole
    existingJobId: string | null
  }>
  existingClientId: string | null
}

// 後方互換（旧型）
export type ParseResultLegacy = {
  job: ParsedJob
  existingJobId: string | null
  existingClientId: string | null
}
