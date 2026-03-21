import { z } from "zod"

export const reviewSchema = z.discriminatedUnion("result", [
  z.object({
    result: z.literal("ACCEPTED"),
    preferredDate: z.string().min(1, "希望日は必須です"),
    preferredTime: z.string().min(1, "希望時間帯は必須です"),
    comment: z.string().optional().or(z.literal("")),
  }),
  z.object({
    result: z.literal("REJECTED"),
    rejectionReason: z.string().min(1, "理由を選択してください"),
    comment: z.string().optional().or(z.literal("")),
  }),
])

export type ReviewFormData = z.infer<typeof reviewSchema>
