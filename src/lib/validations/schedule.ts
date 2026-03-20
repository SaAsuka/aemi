import { z } from "zod"

export const scheduleSchema = z.object({
  applicationId: z.string().min(1, "応募は必須です"),
  date: z.string().min(1, "日付は必須です"),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  status: z.enum(["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"]).default("CONFIRMED"),
  note: z.string().optional().or(z.literal("")),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>
