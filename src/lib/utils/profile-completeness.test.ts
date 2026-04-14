import { describe, it, expect } from "vitest"
import { calcProfileCompleteness } from "./profile-completeness"

const fullProfile = {
  lastName: "山田",
  firstName: "太郎",
  lastNameKana: "ヤマダ",
  firstNameKana: "タロウ",
  stageName: "TARO",
  phone: "090-1234-5678",
  gender: "MALE",
  birthDate: new Date("2000-01-01"),
  height: 175,
  bust: 90,
  waist: 75,
  hip: 95,
  skills: "演技",
  career: "TV出演多数",
  category: "俳優",
  birthplace: "東京都",
  address: "東京都渋谷区",
  nearestStation: "渋谷駅",
  photos: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}` })),
  socialLinks: [{ platform: "INSTAGRAM", url: "https://instagram.com/test" }],
  bankAccount: { bankName: "テスト銀行" },
}

describe("calcProfileCompleteness", () => {
  it("全項目入力で100%を返す", () => {
    const result = calcProfileCompleteness(fullProfile)
    expect(result.percentage).toBe(100)
    expect(result.incomplete).toHaveLength(0)
  })

  it("空プロフィールで低い完成度を返す", () => {
    const result = calcProfileCompleteness({
      lastName: null,
      firstName: null,
      lastNameKana: null,
      firstNameKana: null,
      stageName: null,
      phone: null,
      gender: null,
      birthDate: null,
      height: null,
      bust: null,
      waist: null,
      hip: null,
      skills: null,
      career: null,
      category: null,
      birthplace: null,
      address: null,
      nearestStation: null,
      photos: [],
      socialLinks: [],
      bankAccount: null,
    })
    expect(result.percentage).toBe(0)
    expect(result.incomplete.length).toBe(result.total)
  })

  it("写真1枚で「1枚以上」は完了、「6枚以上」は未完了", () => {
    const result = calcProfileCompleteness({
      ...fullProfile,
      photos: [{ id: "p1" }],
    })
    const labels = result.incomplete.map((i) => i.label)
    expect(labels).toContain("宣材写真（6枚以上）")
    expect(labels).not.toContain("宣材写真（1枚以上）")
  })

  it("スリーサイズは3つ全て必要", () => {
    const result = calcProfileCompleteness({
      ...fullProfile,
      bust: null,
      waist: 75,
      hip: 95,
    })
    const labels = result.incomplete.map((i) => i.label)
    expect(labels).toContain("スリーサイズ")
  })

  it("completedとtotalの合計が一致する", () => {
    const result = calcProfileCompleteness(fullProfile)
    expect(result.completed + result.incomplete.length).toBe(result.total)
  })
})
