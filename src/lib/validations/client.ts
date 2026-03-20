import { z } from "zod"

export const clientSchema = z.object({
  companyName: z.string().min(1, "会社名は必須です"),
  contactName: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email("メールアドレスの形式が不正です").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  lineGroupId: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
})

export type ClientFormData = z.infer<typeof clientSchema>
