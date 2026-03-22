"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

async function verifyTalentAccess(talentId: string) {
  const session = await getSession()
  if (session.role === "admin") return
  if (session.role === "talent" && session.talentId === talentId) return
  throw new Error("権限がありません")
}

export async function addTalentPhoto(talentId: string, url: string) {
  await verifyTalentAccess(talentId)
  const maxOrder = await prisma.talentPhoto.aggregate({
    where: { talentId },
    _max: { sortOrder: true },
  })
  await prisma.talentPhoto.create({
    data: { talentId, url, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  })
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}

export async function deleteTalentPhoto(id: string, talentId: string) {
  await verifyTalentAccess(talentId)
  await prisma.talentPhoto.delete({ where: { id } })
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}

export async function reorderTalentPhotos(talentId: string, orderedIds: string[]) {
  await verifyTalentAccess(talentId)
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.talentPhoto.update({ where: { id }, data: { sortOrder: i } })
    )
  )
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}
