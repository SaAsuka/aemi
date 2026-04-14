import { describe, it, expect } from "vitest"
import { buildStatusMessage, buildDeadlineReminderMessage } from "./line"

describe("buildStatusMessage", () => {
  const jobTitle = "テスト撮影案件"
  const jobId = "job-123"

  it("RESUME_SENTで書類送付メッセージを生成する", () => {
    const msg = buildStatusMessage("RESUME_SENT", jobTitle, jobId)
    expect(msg).toContain("📄 書類を送付しました")
    expect(msg).toContain(jobTitle)
    expect(msg).toContain(`/jobs/${jobId}`)
  })

  it("ACCEPTEDで合格メッセージを生成する", () => {
    const msg = buildStatusMessage("ACCEPTED", jobTitle, jobId)
    expect(msg).toContain("🎉 合格おめでとうございます")
    expect(msg).toContain(jobTitle)
    expect(msg).toContain(`/jobs/${jobId}`)
  })

  it("ACCEPTEDでスケジュール情報を含む", () => {
    const schedule = {
      date: new Date("2026-05-15"),
      startTime: "10:00",
      endTime: "18:00",
      location: "渋谷スタジオ",
    }
    const msg = buildStatusMessage("ACCEPTED", jobTitle, jobId, schedule)
    expect(msg).toContain("5/15")
    expect(msg).toContain("10:00")
    expect(msg).toContain("18:00")
    expect(msg).toContain("渋谷スタジオ")
  })

  it("ACCEPTEDでスケジュールなしでも生成できる", () => {
    const msg = buildStatusMessage("ACCEPTED", jobTitle, jobId, null)
    expect(msg).toContain("🎉 合格おめでとうございます")
    expect(msg).not.toContain("日程:")
  })

  it("REJECTEDで見送りメッセージを生成する", () => {
    const msg = buildStatusMessage("REJECTED", jobTitle, jobId)
    expect(msg).toContain("見送り")
    expect(msg).toContain(jobTitle)
    expect(msg).toContain("/jobs")
  })

  it("不明なステータスでもフォールバックメッセージを返す", () => {
    const msg = buildStatusMessage("UNKNOWN", jobTitle, jobId)
    expect(msg).toContain(jobTitle)
    expect(msg).toContain("ステータスが更新されました")
  })
})

describe("buildDeadlineReminderMessage", () => {
  it("締切リマインドメッセージを生成する", () => {
    const msg = buildDeadlineReminderMessage("モデル撮影", "job-456", new Date("2026-05-20"))
    expect(msg).toContain("⏰ 応募締切が近づいています")
    expect(msg).toContain("モデル撮影")
    expect(msg).toContain("5/20")
    expect(msg).toContain("/jobs/job-456")
  })
})
