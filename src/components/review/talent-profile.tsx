import Image from "next/image"
import { GENDER_LABELS } from "@/types"

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

type TalentData = {
  name: string
  nameKana: string
  gender: string | null
  birthDate: Date | null
  height: number | null
  bust: number | null
  waist: number | null
  hip: number | null
  shoeSize: number | null
  skills: string | null
  hobbies: string | null
  career: string | null
  profileImage: string | null
}

type JobData = {
  title: string
  location: string | null
  fee: number | null
  startsAt: Date | null
  endsAt: Date | null
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function formatDate(date: Date | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
}

export function TalentProfile({ talent, job }: { talent: TalentData; job: JobData }) {
  const bwh = [talent.bust, talent.waist, talent.hip].filter(Boolean).join(" / ")

  return (
    <div className="space-y-6">
      {talent.profileImage && (
        <div className="flex justify-center">
          <div className="relative w-48 h-48 rounded-xl overflow-hidden">
            <Image
              src={talent.profileImage}
              alt={talent.name}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-xl font-bold">{talent.name}</h2>
        <p className="text-sm text-muted-foreground">{talent.nameKana}</p>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-semibold mb-2">プロフィール</h3>
        <InfoRow label="性別" value={talent.gender ? GENDER_LABELS[talent.gender] : null} />
        <InfoRow label="年齢" value={talent.birthDate ? `${calculateAge(new Date(talent.birthDate))}歳` : null} />
        <InfoRow label="身長" value={talent.height ? `${talent.height}cm` : null} />
        <InfoRow label="B・W・H" value={bwh || null} />
        <InfoRow label="靴サイズ" value={talent.shoeSize ? `${talent.shoeSize}cm` : null} />
      </div>

      {(talent.skills || talent.hobbies || talent.career) && (
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold mb-2">詳細</h3>
          <InfoRow label="特技" value={talent.skills} />
          <InfoRow label="趣味" value={talent.hobbies} />
          {talent.career && (
            <div className="py-2">
              <span className="text-sm text-muted-foreground">経歴</span>
              <p className="text-sm mt-1 whitespace-pre-wrap">{talent.career}</p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-semibold mb-2">案件情報</h3>
        <InfoRow label="案件名" value={job.title} />
        <InfoRow label="場所" value={job.location} />
        <InfoRow label="報酬" value={job.fee ? `¥${job.fee.toLocaleString()}` : null} />
        <InfoRow label="開始" value={formatDate(job.startsAt)} />
        <InfoRow label="終了" value={formatDate(job.endsAt)} />
      </div>
    </div>
  )
}
