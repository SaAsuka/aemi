import { z } from "zod"

export const applicationSchema = z.object({
  talentId: z.string().min(1, "タレントは必須です"),
  jobId: z.string().min(1, "案件は必須です"),
  status: z.enum(["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]).default("APPLIED"),
  note: z.string().optional().or(z.literal("")),
})

export type ApplicationFormData = z.infer<typeof applicationSchema>
