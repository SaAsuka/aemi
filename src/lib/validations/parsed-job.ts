import { z } from "zod"

const parsedStatusEnum = z.enum(["ACCEPTED", "REJECTED", "PENDING"])

export const parsedTalentEntrySchema = z.object({
  name: z.string(),
  status: parsedStatusEnum,
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export const parsedJobSchema = z.object({
  title: z.string().nullable().optional().transform((v) => v ?? ""),
  clientCompanyName: z.string().nullable().optional(),
  clientContactName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  dates: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  talents: z.array(parsedTalentEntrySchema),
})

export type ParsedTalentEntry = z.infer<typeof parsedTalentEntrySchema>
export type ParsedJob = z.infer<typeof parsedJobSchema>

export type ParseResult = {
  job: ParsedJob
  existingJobId: string | null
  existingClientId: string | null
}
