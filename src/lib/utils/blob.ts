export function blobProxyUrl(url: string): string {
  if (url.includes("blob.vercel-storage.com")) {
    return `/api/blob?url=${encodeURIComponent(url)}`
  }
  return url
}
