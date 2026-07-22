import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const results: Record<string, unknown> = {}

  // 環境変数の存在確認
  results.SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY ? "SET" : "MISSING"
  results.SUPABASE_URL = process.env.SUPABASE_URL ?? "(未設定 - DATABASE_URLから導出)"
  results.DATABASE_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":***@") : "MISSING"

  // URL導出ロジック
  let supabaseUrl: string | null = null
  try {
    if (process.env.SUPABASE_URL) {
      supabaseUrl = process.env.SUPABASE_URL
    } else {
      const dbUrl = process.env.DATABASE_URL ?? ""
      const match = dbUrl.match(/db\.([a-z0-9]+)\.supabase\.co/) ?? dbUrl.match(/postgres\.([a-z0-9]+):[^@]+@/)
      if (match) supabaseUrl = `https://${match[1]}.supabase.co`
    }
    results.resolvedSupabaseUrl = supabaseUrl ?? "導出失敗"
  } catch (e) {
    results.resolvedSupabaseUrl = `ERROR: ${e}`
  }

  if (!supabaseUrl || !process.env.SERVICE_ROLE_KEY) {
    return NextResponse.json({ ...results, status: "環境変数不足のため接続不可" }, { status: 500 })
  }

  // Supabase接続テスト
  try {
    const supabase = createClient(supabaseUrl, process.env.SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // バケット一覧取得
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      results.bucketsError = bucketsError.message
    } else {
      results.buckets = buckets?.map((b) => b.name) ?? []
      results.talentFilesBucketExists = buckets?.some((b) => b.name === "talent-files") ?? false
    }

    // talent-filesバケットへの書き込みテスト
    if (!bucketsError && results.talentFilesBucketExists) {
      const testContent = Buffer.from("test")
      const { error: uploadError } = await supabase.storage
        .from("talent-files")
        .upload("_diagnostic/test.txt", testContent, { contentType: "text/plain", upsert: true })
      results.uploadTest = uploadError ? `FAIL: ${uploadError.message}` : "OK"

      // 書き込みテスト後に削除
      if (!uploadError) {
        await supabase.storage.from("talent-files").remove(["_diagnostic/test.txt"])
      }
    }
  } catch (e) {
    results.connectionError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
