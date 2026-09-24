import http from "node:http"
import type { AddressInfo } from "node:net"
import { test, expect } from "@playwright/test"

// WebKit(Safari)は、FormDataに日本語などの非ASCII文字を含むファイル名のFileを
// 追加してfetchで実際にネットワーク送信すると
// 「The string did not match the expected pattern.」を投げることがある。
// ローカルサーバーへの実送信で再現を試みる。
test.describe("Safari/WebKitでの日本語ファイル名アップロード", () => {
  let server: http.Server
  let baseUrl: string

  test.beforeAll(async () => {
    server = http.createServer((req, res) => {
      req.resume()
      req.on("end", () => {
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ ok: true }))
      })
    })
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const { port } = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}`
  })

  test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  test("日本語ファイル名のままだと送信に失敗する（現象の再現）", async ({ page }) => {
    await page.goto("about:blank")

    const result = await page.evaluate(async (url) => {
      try {
        const file = new File([new Uint8Array([1, 2, 3])], "宣材写真_山中悠矢.jpg", { type: "image/jpeg" })
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch(url, { method: "POST", body: fd })
        return { threw: false, ok: res.ok }
      } catch (e) {
        return { threw: true, message: e instanceof Error ? e.message : String(e) }
      }
    }, baseUrl)

    console.log("[日本語ファイル名]", result)
  })

  test("対策後（ASCIIファイル名への付け替え）は必ず成功する", async ({ page }) => {
    await page.goto("about:blank")

    const result = await page.evaluate(async (url) => {
      try {
        const original = new File([new Uint8Array([1, 2, 3])], "宣材写真_山中悠矢.jpg", { type: "image/jpeg" })
        const ext = original.name.split(".").pop() || "jpg"
        const safeFile = new File([original], `photo-${Date.now()}.${ext}`, { type: original.type })

        const fd = new FormData()
        fd.append("file", safeFile)
        const res = await fetch(url, { method: "POST", body: fd })
        return { threw: false, ok: res.ok }
      } catch (e) {
        return { threw: true, message: e instanceof Error ? e.message : String(e) }
      }
    }, baseUrl)

    console.log("[ASCIIファイル名]", result)
    expect(result.threw).toBe(false)
    expect(result.ok).toBe(true)
  })
})
