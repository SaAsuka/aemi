"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function disconnectLine() {
  const session = await getSession()
  if (!session.talentId || session.role !== "talent") {
    return { error: "認証エラー" }
  }

  await prisma.talent.update({
    where: { id: session.talentId },
    data: { lineUserId: null },
  })

  revalidatePath("/mypage/settings")
  return { success: true }
}
