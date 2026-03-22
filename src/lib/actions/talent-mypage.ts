"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { talentSchema } from "@/lib/validations/talent"

export async function updateMyProfile(formData: FormData) {
  const session = await getSession()
  if (!session.talentId || session.role !== "talent") {
    return { error: { _form: ["認証エラー"] } }
  }

  const raw = Object.fromEntries(formData)
  const parsed = talentSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

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
      instagramUrl: data.instagramUrl || null,
      xUrl: data.xUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      websiteUrl: data.websiteUrl || null,
      bankName: data.bankName || null,
      bankBranch: data.bankBranch || null,
      bankAccountType: data.bankAccountType || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountHolder: data.bankAccountHolder || null,
    },
  })

  revalidatePath("/mypage")
  revalidatePath("/mypage/settings")
  revalidatePath(`/admin/talents/${session.talentId}`)
  return { success: true }
}
