import { cache } from "react"
import { unstable_cache } from "next/cache"
import { prisma } from "./db"

export const getActiveTalentOptions = cache(
  unstable_cache(
    () =>
      prisma.talent.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, nameKana: true },
      }),
    ["active-talent-options"],
    { revalidate: 60, tags: ["talents"] }
  )
)

export const getOpenJobOptions = cache(
  unstable_cache(
    () =>
      prisma.job.findMany({
        where: { status: "OPEN" },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      }),
    ["open-job-options"],
    { revalidate: 60, tags: ["jobs"] }
  )
)

export async function getDefaultClientId(): Promise<string> {
  const existing = await prisma.client.findFirst({
    where: { companyName: { contains: "avex", mode: "insensitive" } },
    select: { id: true },
  })
  if (existing) return existing.id

  const created = await prisma.client.create({
    data: { companyName: "avex" },
    select: { id: true },
  })
  return created.id
}

export const getTalentFilterOptions = cache(
  unstable_cache(
    async () => {
      const talents = await prisma.talent.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      })
      return talents.map((t) => ({ value: t.name, label: t.name }))
    },
    ["talent-filter-options"],
    { revalidate: 60, tags: ["talents"] }
  )
)

export const getJobFilterOptions = cache(
  unstable_cache(
    async () => {
      const jobs = await prisma.job.findMany({
        select: { title: true },
        orderBy: { title: "asc" },
      })
      return jobs.map((j) => ({ value: j.title, label: j.title }))
    },
    ["job-filter-options"],
    { revalidate: 60, tags: ["jobs"] }
  )
)
