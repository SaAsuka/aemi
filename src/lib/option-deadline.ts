// オプションの申込締切を過ぎているか（締切の日時を過ぎたら購入できない）
export function isOptionClosed(deadline: Date | null | undefined, now: Date = new Date()) {
  return Boolean(deadline) && new Date(deadline!).getTime() < now.getTime()
}
