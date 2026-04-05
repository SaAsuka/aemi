"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { setupSchema } from "@/lib/validations/talent"
import { upsertSocialLinks, upsertBankAccount } from "./talent-relations"

export async function setupTalent(formData: FormData) {
  const session = await getSession()
  if (!session.talentId || session.role !== "talent") {
    return { error: { _form: ["認証エラー"] } }
  }

  const raw = Object.fromEntries(formData)
  const parsed = setupSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const passwordHash = await bcrypt.hash(data.password, 10)

  await prisma.talent.update({
    where: { id: session.talentId },
    data: {
      lastName: data.lastName,
      firstName: data.firstName,
      lastNameKana: data.lastNameKana,
      firstNameKana: data.firstNameKana,
      name: data.lastName + " " + data.firstName,
      nameKana: data.lastNameKana + " " + data.firstNameKana,
      stageName: data.stageName || null,
      nameRomaji: data.nameRomaji || null,
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
      passwordHash,
    },
  })

  await upsertSocialLinks(session.talentId, data)
  await upsertBankAccount(session.talentId, data)

  revalidatePath("/mypage")
  return { success: true, redirect: "/mypage" }
}
