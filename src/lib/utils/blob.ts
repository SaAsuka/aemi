export function blobProxyUrl(url: string, cacheBust = false): string {
  if (url.includes("blob.vercel-storage.com")) {
    const base = `/api/blob?url=${encodeURIComponent(url)}`
    return cacheBust ? `${base}&t=${Date.now()}` : base
  }
  return cacheBust ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url
}
