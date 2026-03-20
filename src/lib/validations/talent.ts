import { z } from "zod"

export const talentSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  nameKana: z.string().min(1, "フリガナは必須です"),
  email: z.string().email("メールアドレスの形式が不正です").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthDate: z.string().optional().or(z.literal("")),
  height: z.coerce.number().int().positive().optional().or(z.literal("")),
  lineUserId: z.string().optional().or(z.literal("")),
  profileImage: z.string().optional().or(z.literal("")),
  resume: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "WITHDRAWN"]).default("ACTIVE"),
  note: z.string().optional().or(z.literal("")),
})

export type TalentFormData = z.infer<typeof talentSchema>
