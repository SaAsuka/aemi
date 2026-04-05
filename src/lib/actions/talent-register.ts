"use server"

import { prisma } from "@/lib/db"
import { talentBaseSchema } from "@/lib/validations/talent"
import { upsertSocialLinks, upsertBankAccount } from "./talent-relations"

export async function registerTalent(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = talentBaseSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  let photoUrls: string[] = []
  const photoUrlsRaw = formData.get("photoUrls")
  if (typeof photoUrlsRaw === "string" && photoUrlsRaw) {
    try { photoUrls = JSON.parse(photoUrlsRaw) } catch { /* ignore */ }
  }

  const talent = await prisma.talent.create({

    data: {
      lastName: data.lastName,
      firstName: data.firstName,
      lastNameKana: data.lastNameKana,
      firstNameKana: data.firstNameKana,
      name: data.lastName + " " + data.firstName,
      nameKana: data.lastNameKana + " " + data.firstNameKana,
      nameRomaji: data.nameRomaji || null,
      email: data.email || null,
      phone: data.phone || null,
      gender: data.gender || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      height: typeof data.height === "number" ? data.height : null,
      bust: typeof data.bust === "number" ? data.bust : null,
      waist: typeof data.waist === "number" ? data.waist : null,
      hip: typeof data.hip === "number" ? data.hip : null,
      shoeSize: typeof data.shoeSize === "number" ? data.shoeSize : null,
      skills: data.skills || null,
      hobbies: data.hobbies || null,
      qualifications: data.qualifications || null,
      career: data.career || null,
      category: data.category || null,
      birthplace: data.birthplace || null,
      address: data.address || null,
      representativeWork: data.representativeWork || null,
      nearestStation: data.nearestStation || null,
      profileImage: photoUrls[0] || null,
      status: "ACTIVE",
      photos: photoUrls.length > 0 ? {
        create: photoUrls.map((url, i) => ({ url, sortOrder: i })),
      } : undefined,
    },
  })

  await upsertSocialLinks(talent.id, data)
  await upsertBankAccount(talent.id, data)

  return { success: true }
}
