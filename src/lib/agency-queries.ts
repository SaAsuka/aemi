import { prisma } from "./db"

export async function getAgencyActiveTalentOptions(agencyId: string) {
  return prisma.talent.findMany({
    where: { agencyId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, nameKana: true },
  })
}

export async function getAgencyOpenJobOptions(agencyId: string) {
  return prisma.job.findMany({
    where: { agencyId, status: "OPEN" },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  })
}

export async function getAgencyTalentFilterOptions(agencyId: string) {
  const talents = await prisma.talent.findMany({
    where: { agencyId },
    select: { name: true },
    orderBy: { name: "asc" },
  })
  return talents.map((t) => ({ value: t.name, label: t.name }))
}

export async function getAgencyJobFilterOptions(agencyId: string) {
  const jobs = await prisma.job.findMany({
    where: { agencyId },
    select: { title: true },
    orderBy: { title: "asc" },
  })
  return jobs.map((j) => ({ value: j.title, label: j.title }))
}
