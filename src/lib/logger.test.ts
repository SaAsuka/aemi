import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const ingestMock = vi.fn()
const flushMock = vi.fn().mockResolvedValue(undefined)

vi.mock("@axiomhq/js", () => ({
  // new Axiom(...) で呼ばれるため、コンストラクタ化できないアロー関数は使えない
  Axiom: vi.fn().mockImplementation(function () {
    return { ingest: ingestMock, flush: flushMock }
  }),
}))

describe("logger", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    ingestMock.mockClear()
    flushMock.mockClear()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("AXIOM_TOKEN/AXIOM_DATASETが未設定ならconsoleにフォールバックする", async () => {
    delete process.env.AXIOM_TOKEN
    delete process.env.AXIOM_DATASET
    const { logger } = await import("./logger")

    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await logger.error("test_event", { foo: "bar" })

    expect(spy).toHaveBeenCalledWith("[test_event]", { foo: "bar" })
    expect(ingestMock).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it("AXIOM_TOKEN/AXIOM_DATASETが設定されていればAxiomへ送信する", async () => {
    process.env.AXIOM_TOKEN = "test-token"
    process.env.AXIOM_DATASET = "test-dataset"
    const { logger } = await import("./logger")

    await logger.error("upload_failed", { talentId: "t1" })

    expect(ingestMock).toHaveBeenCalledTimes(1)
    const [dataset, events] = ingestMock.mock.calls[0]
    expect(dataset).toBe("test-dataset")
    expect(events[0]).toMatchObject({ level: "error", event: "upload_failed", talentId: "t1" })
    expect(flushMock).toHaveBeenCalledTimes(1)
  })

  it("info/warn/errorでlevelが正しく設定される", async () => {
    process.env.AXIOM_TOKEN = "test-token"
    process.env.AXIOM_DATASET = "test-dataset"
    const { logger } = await import("./logger")

    await logger.info("info_event")
    await logger.warn("warn_event")

    expect(ingestMock.mock.calls[0][1][0]).toMatchObject({ level: "info", event: "info_event" })
    expect(ingestMock.mock.calls[1][1][0]).toMatchObject({ level: "warn", event: "warn_event" })
  })
})
