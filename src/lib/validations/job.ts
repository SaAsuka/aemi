import { z } from "zod"

export const jobSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(1, "案件名は必須です"),
  description: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  fee: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  genderReq: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  ageMin: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  ageMax: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  heightMin: z.coerce.number().int().positive().optional().or(z.literal("")),
  heightMax: z.coerce.number().int().positive().optional().or(z.literal("")),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "CANCELLED"]).default("DRAFT"),
  note: z.string().optional().or(z.literal("")),
})

export type JobFormData = z.infer<typeof jobSchema>
