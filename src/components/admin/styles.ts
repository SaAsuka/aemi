// 管理画面（黒×白デザイン）で使い回すボタン・入力欄の見た目
// テーマ色（オレンジ）に依存しないよう、色はすべて neutral で直接指定する

const BASE =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

export const BTN_PRIMARY = `${BASE} bg-neutral-950 text-white hover:bg-neutral-800`
export const BTN_SECONDARY = `${BASE} border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50`
export const BTN_GHOST = `${BASE} text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950`

export const FIELD =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-950 sm:text-sm transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus-visible:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/10 aria-invalid:border-red-600 aria-invalid:focus-visible:border-red-600 aria-invalid:focus-visible:ring-red-600/15"

export const PANEL = "rounded-xl border border-neutral-200 bg-white"
