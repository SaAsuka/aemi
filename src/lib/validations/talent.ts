import { z } from "zod"

const optionalString = z.string().optional().or(z.literal(""))

export const talentSchema = z.object({
  name: z.string().min(1, "本名は必須です"),
  nameKana: z.string().min(1, "フリガナは必須です"),
  stageName: optionalString,
  nameRomaji: optionalString,
  email: z.string().email("メールアドレスの形式が不正です").optional().or(z.literal("")),
  phone: optionalString,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthDate: optionalString,
  height: z.coerce.number().int().positive().optional().or(z.literal("")),
  bust: z.coerce.number().int().positive().optional().or(z.literal("")),
  waist: z.coerce.number().int().positive().optional().or(z.literal("")),
  hip: z.coerce.number().int().positive().optional().or(z.literal("")),
  shoeSize: z.coerce.number().positive().optional().or(z.literal("")),
  skills: optionalString,
  hobbies: optionalString,
  qualifications: optionalString,
  career: optionalString,
  category: optionalString,
  birthplace: optionalString,
  address: optionalString,
  representativeWork: optionalString,
  lineUserId: optionalString,
  profileImage: optionalString,
  resume: optionalString,
  nearestStation: optionalString,
  instagramUrl: optionalString,
  xUrl: optionalString,
  tiktokUrl: optionalString,
  websiteUrl: optionalString,
  bankName: optionalString,
  bankBranch: optionalString,
  bankAccountType: optionalString,
  bankAccountNumber: optionalString,
  bankAccountHolder: optionalString,
  status: z.enum(["ACTIVE", "INACTIVE", "WITHDRAWN"]).default("ACTIVE"),
  note: optionalString,
})

export type TalentFormData = z.infer<typeof talentSchema>
