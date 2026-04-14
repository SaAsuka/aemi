import { describe, it, expect } from "vitest"
import { matchTalentToJob } from "./job-matching"

describe("matchTalentToJob", () => {
  const baseTalent = {
    gender: "FEMALE" as const,
    birthDate: new Date("2000-01-01"),
    height: 165,
  }

  const baseJob = {
    genderReq: null,
    ageMin: null,
    ageMax: null,
    heightMin: null,
    heightMax: null,
  }

  it("全条件マッチで match を返す", () => {
    const result = matchTalentToJob(baseTalent, {
      ...baseJob,
      genderReq: "FEMALE",
      heightMin: 160,
      heightMax: 170,
    })
    expect(result.matchStatus).toBe("match")
    expect(result.unmatchReasons).toHaveLength(0)
  })

  it("条件なしで match を返す", () => {
    const result = matchTalentToJob(baseTalent, baseJob)
    expect(result.matchStatus).toBe("match")
  })

  it("性別不一致で detail に具体的な理由を含む", () => {
    const result = matchTalentToJob(baseTalent, {
      ...baseJob,
      genderReq: "MALE",
    })
    expect(result.matchStatus).toBe("unmatch")
    expect(result.unmatchReasons).toHaveLength(1)
    expect(result.unmatchReasons[0].field).toBe("gender")
    expect(result.unmatchReasons[0].detail).toContain("男性")
    expect(result.unmatchReasons[0].detail).toContain("女性")
  })

  it("身長条件外で detail に具体的な数値を含む", () => {
    const result = matchTalentToJob(
      { ...baseTalent, height: 175 },
      { ...baseJob, heightMin: 160, heightMax: 170 },
    )
    expect(result.matchStatus).toBe("unmatch")
    expect(result.unmatchReasons[0].field).toBe("height")
    expect(result.unmatchReasons[0].detail).toBe("要: 160〜170cm / あなた: 175cm")
  })

  it("身長が下限未満で detail に数値を含む", () => {
    const result = matchTalentToJob(
      { ...baseTalent, height: 155 },
      { ...baseJob, heightMin: 160, heightMax: 170 },
    )
    expect(result.unmatchReasons[0].detail).toBe("要: 160〜170cm / あなた: 155cm")
  })

  it("年齢条件外で detail に具体的な数値を含む", () => {
    const result = matchTalentToJob(
      { ...baseTalent, birthDate: new Date("2010-01-01") },
      { ...baseJob, ageMin: 20, ageMax: 30 },
    )
    expect(result.matchStatus).toBe("unmatch")
    expect(result.unmatchReasons[0].field).toBe("age")
    expect(result.unmatchReasons[0].detail).toContain("要: 20〜30歳")
    expect(result.unmatchReasons[0].detail).toContain("あなた:")
  })

  it("情報未入力で partial を返す", () => {
    const result = matchTalentToJob(
      { gender: null, birthDate: null, height: null },
      { ...baseJob, genderReq: "FEMALE", heightMin: 160 },
    )
    expect(result.matchStatus).toBe("partial")
    expect(result.unmatchReasons).toHaveLength(0)
  })

  it("複数の不一致理由を返す", () => {
    const result = matchTalentToJob(
      { ...baseTalent, height: 175 },
      { ...baseJob, genderReq: "MALE", heightMin: 160, heightMax: 170 },
    )
    expect(result.matchStatus).toBe("unmatch")
    expect(result.unmatchReasons).toHaveLength(2)
    expect(result.unmatchReasons.map((r) => r.field)).toEqual(["gender", "height"])
  })
})
