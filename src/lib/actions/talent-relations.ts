"use server"

import { prisma } from "@/lib/db"
import type { SocialPlatform } from "@/generated/prisma/client"

type SocialLinkData = {
  instagramUrl?: string | null
  xUrl?: string | null
  tiktokUrl?: string | null
  websiteUrl?: string | null
}

type BankAccountData = {
  bankName?: string | null
  bankBranch?: string | null
  bankAccountType?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
}

const PLATFORM_MAP: [keyof SocialLinkData, SocialPlatform][] = [
  ["instagramUrl", "INSTAGRAM"],
  ["xUrl", "X"],
  ["tiktokUrl", "TIKTOK"],
  ["websiteUrl", "WEBSITE"],
]

export async function upsertSocialLinks(talentId: string, data: SocialLinkData) {
  for (const [field, platform] of PLATFORM_MAP) {
    const url = data[field]
    if (url) {
      await prisma.talentSocialLink.upsert({
        where: { talentId_platform: { talentId, platform } },
        create: { talentId, platform, url },
        update: { url },
      })
    } else {
      await prisma.talentSocialLink.deleteMany({
        where: { talentId, platform },
      })
    }
  }
}

export async function upsertBankAccount(talentId: string, data: BankAccountData) {
  const { bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountHolder } = data
  if (bankName && bankBranch && bankAccountType && bankAccountNumber && bankAccountHolder) {
    await prisma.talentBankAccount.upsert({
      where: { talentId },
      create: {
        talentId,
        bankName,
        branchName: bankBranch,
        accountType: bankAccountType,
        accountNumber: bankAccountNumber,
        accountHolder: bankAccountHolder,
      },
      update: {
        bankName,
        branchName: bankBranch,
        accountType: bankAccountType,
        accountNumber: bankAccountNumber,
        accountHolder: bankAccountHolder,
      },
    })
  }
}
