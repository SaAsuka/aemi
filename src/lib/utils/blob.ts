export function blobProxyUrl(url: string): string {
  return `/api/blob?url=${encodeURIComponent(url)}`
}
