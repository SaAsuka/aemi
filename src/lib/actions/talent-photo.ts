"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function addTalentPhoto(talentId: string, url: string) {
  const maxOrder = await prisma.talentPhoto.aggregate({
    where: { talentId },
    _max: { sortOrder: true },
  })
  await prisma.talentPhoto.create({
    data: { talentId, url, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  })
  revalidatePath(`/admin/talents/${talentId}`)
}

export async function deleteTalentPhoto(id: string, talentId: string) {
  await prisma.talentPhoto.delete({ where: { id } })
  revalidatePath(`/admin/talents/${talentId}`)
}

export async function reorderTalentPhotos(talentId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.talentPhoto.update({ where: { id }, data: { sortOrder: i } })
    )
  )
  revalidatePath(`/admin/talents/${talentId}`)
}
