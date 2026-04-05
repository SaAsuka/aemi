import { z } from "zod"

const optionalString = z.string().optional().or(z.literal(""))

export const talentBaseSchema = z.object({
  lastName: z.string().min(1, "姓は必須です"),
  firstName: z.string().min(1, "名は必須です"),
  lastNameKana: z.string().min(1, "セイは必須です"),
  firstNameKana: z.string().min(1, "メイは必須です"),
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

export const bankAccountSchema = z.object({
  bankName: z.string().min(1, "銀行名は必須です"),
  bankBranch: z.string().min(1, "支店名は必須です"),
  bankAccountType: z.string().min(1, "種別は必須です"),
  bankAccountNumber: z.string().min(1, "口座番号は必須です"),
  bankAccountHolder: z.string().min(1, "口座名義は必須です"),
})

export const talentSchema = talentBaseSchema.extend({
  bankName: z.string().min(1, "銀行名は必須です"),
  bankBranch: z.string().min(1, "支店名は必須です"),
  bankAccountType: z.string().min(1, "種別は必須です"),
  bankAccountNumber: z.string().min(1, "口座番号は必須です"),
  bankAccountHolder: z.string().min(1, "口座名義は必須です"),
})

export const setupSchema = talentSchema.extend({
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードが一致しません",
  path: ["passwordConfirm"],
})

export const passwordLoginSchema = z.object({
  email: z.string().email("メールアドレスの形式が不正です"),
  password: z.string().min(1, "パスワードを入力してください"),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "パスワードが一致しません",
  path: ["passwordConfirm"],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください"),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: "パスワードが一致しません",
  path: ["newPasswordConfirm"],
})

export type TalentFormData = z.infer<typeof talentBaseSchema>
