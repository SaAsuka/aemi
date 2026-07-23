import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (session.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const result: Record<string, unknown> = {}

  // 1. 環境変数の確認
  const dbUrl = process.env.DATABASE_URL ?? ""
  const supabaseUrlEnv = process.env.SUPABASE_URL ?? ""
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY ?? ""

  result.env = {
    SUPABASE_URL_set: !!supabaseUrlEnv,
    SUPABASE_URL_value: supabaseUrlEnv ? `${supabaseUrlEnv.slice(0, 30)}...` : null,
    DATABASE_URL_set: !!dbUrl,
    DATABASE_URL_prefix: dbUrl ? dbUrl.slice(0, 20) + "..." : null,
    SERVICE_ROLE_KEY_set: !!serviceRoleKey,
    SERVICE_ROLE_KEY_length: serviceRoleKey.length,
    SERVICE_ROLE_KEY_suffix: serviceRoleKey ? `...${serviceRoleKey.slice(-8)}` : null,
  }

  // 2. URLの導出
  let derivedUrl: string | null = null
  let urlSource: string | null = null

  if (supabaseUrlEnv) {
    derivedUrl = supabaseUrlEnv
    urlSource = "SUPABASE_URL env var"
  } else {
    const match1 = dbUrl.match(/db\.([a-z0-9]+)\.supabase\.co/)
    const match2 = dbUrl.match(/postgres\.([a-z0-9]+):[^@]+@/)
    if (match1) {
      derivedUrl = `https://${match1[1]}.supabase.co`
      urlSource = "DATABASE_URL regex (db.xxx.supabase.co)"
    } else if (match2) {
      derivedUrl = `https://${match2[1]}.supabase.co`
      urlSource = "DATABASE_URL regex (postgres.xxx:...@)"
    } else {
      urlSource = "マッチなし — URLを導出できませんでした"
    }
  }

  result.url = {
    derived: derivedUrl,
    source: urlSource,
  }

  if (!derivedUrl) {
    return NextResponse.json({ ...result, error: "Supabase URLを導出できません" })
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ ...result, error: "SERVICE_ROLE_KEY が未設定です" })
  }

  // 3. Supabase接続テスト
  try {
    const supabase = createClient(derivedUrl, serviceRoleKey, { auth: { persistSession: false } })

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      result.connection = { ok: false, error: listError.message }
    } else {
      const bucketNames = buckets?.map((b) => b.name) ?? []
      const hasTalentFiles = bucketNames.includes("talent-files")

      result.connection = {
        ok: true,
        buckets: bucketNames,
        talent_files_bucket_exists: hasTalentFiles,
      }

      // 4. talent-filesバケットに小さいテストファイルをアップロード
      if (hasTalentFiles) {
        const testContent = Buffer.from("storage-check-test")
        const testPath = `_check/${Date.now()}-test.txt`
        const { error: uploadError } = await supabase.storage
          .from("talent-files")
          .upload(testPath, testContent, { contentType: "text/plain", upsert: true })

        if (uploadError) {
          result.upload_test = { ok: false, error: uploadError.message }
        } else {
          await supabase.storage.from("talent-files").remove([testPath])
          result.upload_test = { ok: true }
        }
      }
    }
  } catch (e) {
    result.connection = { ok: false, error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json(result)
}
