import { z } from "zod"

const parsedStatusEnum = z.enum(["ACCEPTED", "REJECTED", "PENDING"])

export const parsedTalentEntrySchema = z.object({
  name: z.string(),
  status: parsedStatusEnum,
  date: z.string().optional(),
  startTime: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
})

export const parsedJobSchema = z.object({
  title: z.string(),
  clientCompanyName: z.string().optional(),
  clientContactName: z.string().optional(),
  location: z.string().optional(),
  dates: z.string().optional(),
  note: z.string().optional(),
  talents: z.array(parsedTalentEntrySchema),
})

export type ParsedTalentEntry = z.infer<typeof parsedTalentEntrySchema>
export type ParsedJob = z.infer<typeof parsedJobSchema>

export type TalentCandidate = {
  id: string
  name: string
  nameKana: string
}

export type MatchedTalent = ParsedTalentEntry & {
  matchedTalentId: string | null
  candidates: TalentCandidate[]
}

export type ParseResult = {
  job: ParsedJob
  matchedTalents: MatchedTalent[]
  existingJobId: string | null
  existingClientId: string | null
}
