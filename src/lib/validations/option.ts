import { z } from "zod"

export const optionSchema = z.object({
  name: z.string().min(1, "オプション名は必須です"),
  description: z.string().optional().or(z.literal("")),
  category: z.enum(["PHOTOGRAPHY", "STYLING", "LESSON", "OTHER"]).default("OTHER"),
  price: z.coerce.number().int().positive("価格は1円以上です"),
  imageUrl: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().nonnegative().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("DRAFT"),
})

export type OptionFormData = z.infer<typeof optionSchema>
