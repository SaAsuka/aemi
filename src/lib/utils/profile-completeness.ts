type TalentProfile = {
  lastName: string | null
  firstName: string | null
  lastNameKana: string | null
  firstNameKana: string | null
  stageName: string | null
  phone: string | null
  gender: string | null
  birthDate: Date | null
  height: number | null
  bust: number | null
  waist: number | null
  hip: number | null
  skills: string | null
  career: string | null
  category: string | null
  birthplace: string | null
  address: string | null
  nearestStation: string | null
  photos: { id: string }[]
  socialLinks: { platform: string; url: string }[]
  bankAccount: { bankName: string } | null
}

type CheckItem = {
  label: string
  section: string
  done: boolean
}

export function calcProfileCompleteness(talent: TalentProfile) {
  const items: CheckItem[] = [
    { label: "宣材写真（6枚以上）", section: "写真", done: talent.photos.length >= 6 },
    { label: "宣材写真（1枚以上）", section: "写真", done: talent.photos.length >= 1 },
    { label: "姓名", section: "基本情報", done: !!talent.lastName && !!talent.firstName },
    { label: "カナ", section: "基本情報", done: !!talent.lastNameKana && !!talent.firstNameKana },
    { label: "芸名", section: "基本情報", done: !!talent.stageName },
    { label: "電話番号", section: "基本情報", done: !!talent.phone },
    { label: "性別", section: "基本情報", done: !!talent.gender },
    { label: "生年月日", section: "基本情報", done: !!talent.birthDate },
    { label: "カテゴリ", section: "基本情報", done: !!talent.category },
    { label: "出身地", section: "基本情報", done: !!talent.birthplace },
    { label: "現住所", section: "基本情報", done: !!talent.address },
    { label: "最寄駅", section: "基本情報", done: !!talent.nearestStation },
    { label: "身長", section: "身体情報", done: talent.height != null },
    { label: "スリーサイズ", section: "身体情報", done: talent.bust != null && talent.waist != null && talent.hip != null },
    { label: "特技", section: "スキル", done: !!talent.skills },
    { label: "経歴", section: "スキル", done: !!talent.career },
    { label: "SNS（1つ以上）", section: "SNS", done: talent.socialLinks.length > 0 },
    { label: "振込先情報", section: "振込先", done: !!talent.bankAccount },
  ]

  const completed = items.filter((i) => i.done).length
  const percentage = Math.round((completed / items.length) * 100)
  const incomplete = items.filter((i) => !i.done)

  return { percentage, total: items.length, completed, incomplete }
}
