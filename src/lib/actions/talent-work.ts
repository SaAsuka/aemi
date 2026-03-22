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

export async function addTalentWork(talentId: string, imageUrl: string, caption: string) {
  await verifyTalentAccess(talentId)
  const maxOrder = await prisma.talentWork.aggregate({
    where: { talentId },
    _max: { sortOrder: true },
  })
  await prisma.talentWork.create({
    data: { talentId, imageUrl, caption, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  })
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}

export async function updateTalentWork(id: string, talentId: string, caption: string) {
  await verifyTalentAccess(talentId)
  await prisma.talentWork.update({ where: { id }, data: { caption } })
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}

export async function deleteTalentWork(id: string, talentId: string) {
  await verifyTalentAccess(talentId)
  await prisma.talentWork.delete({ where: { id } })
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}

export async function reorderTalentWorks(talentId: string, orderedIds: string[]) {
  await verifyTalentAccess(talentId)
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.talentWork.update({ where: { id }, data: { sortOrder: i } })
    )
  )
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/mypage")
}
