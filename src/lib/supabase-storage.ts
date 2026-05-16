import { createClient } from "@supabase/supabase-js"

const BUCKET = "talent-files"

function getSupabaseUrl(): string {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL
  // DATABASE_URL から project ref を抽出してフォールバック
  const dbUrl = process.env.DATABASE_URL ?? ""
  const match = dbUrl.match(/db\.([a-z0-9]+)\.supabase\.co/) ?? dbUrl.match(/postgres\.([a-z0-9]+):[^@]+@/)
  if (match) return `https://${match[1]}.supabase.co`
  throw new Error("SUPABASE_URL が設定されていません")
}

function getAdminClient() {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY が設定されていません")
  return createClient(url, key, { auth: { persistSession: false } })
}

export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes(".supabase.co/storage/")
}

export function extractStoragePath(url: string): string {
  // https://xxx.supabase.co/storage/v1/object/talent-files/photos/...
  // → photos/...
  const match = url.match(/\/storage\/v1\/object\/[^/]+\/(.+)$/)
  return match ? match[1] : url
}

export async function uploadToStorage(
  file: Buffer | Blob | Uint8Array,
  path: string,
  contentType: string,
): Promise<string> {
  const supabase = getAdminClient()
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`)

  const url = getSupabaseUrl()
  return `${url}/storage/v1/object/${BUCKET}/${path}`
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = getAdminClient()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error || !data) throw new Error(`署名付きURL取得失敗: ${error?.message}`)
  return data.signedUrl
}

export async function deleteFromStorage(urls: string[]): Promise<void> {
  if (urls.length === 0) return
  const paths = urls.map(extractStoragePath)
  const supabase = getAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.error(`[Storage] 削除失敗: ${error.message}`)
}

export function generateStoragePath(
  category: "photos" | "works" | "applications" | "pdfs",
  filename: string,
  id?: string,
): string {
  const ts = Date.now()
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  return id ? `${category}/${id}/${ts}-${safe}` : `${category}/${ts}-${safe}`
}
