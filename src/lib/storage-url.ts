import "server-only"
import { isSupabaseStorageUrl, extractStoragePath, getSignedUrl } from "./supabase-storage"

export async function resolveStorageUrl(url: string | null | undefined, expiresIn = 3600): Promise<string | null> {
  if (!url) return null
  if (!isSupabaseStorageUrl(url)) return url
  try {
    const path = extractStoragePath(url)
    return await getSignedUrl(path, expiresIn)
  } catch {
    return null
  }
}
