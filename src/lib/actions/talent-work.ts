"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function addTalentWork(talentId: string, imageUrl: string, caption: string) {
  const maxOrder = await prisma.talentWork.aggregate({
    where: { talentId },
    _max: { sortOrder: true },
  })
  await prisma.talentWork.create({
    data: { talentId, imageUrl, caption, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  })
  revalidatePath(`/admin/talents/${talentId}`)
}

export async function updateTalentWork(id: string, talentId: string, caption: string) {
  await prisma.talentWork.update({ where: { id }, data: { caption } })
  revalidatePath(`/admin/talents/${talentId}`)
}

export async function deleteTalentWork(id: string, talentId: string) {
  await prisma.talentWork.delete({ where: { id } })
  revalidatePath(`/admin/talents/${talentId}`)
}

export async function reorderTalentWorks(talentId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.talentWork.update({ where: { id }, data: { sortOrder: i } })
    )
  )
  revalidatePath(`/admin/talents/${talentId}`)
}
