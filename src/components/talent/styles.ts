// タレント側（黒×白デザイン）で使い回すボタン・入力欄の見た目
// 管理画面の styles と同じ色づかいで、スマホで押しやすいよう高さを大きめにし、
// iOS で入力時に拡大されないよう文字は 16px にしている

const BASE =
  "inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-base font-medium whitespace-nowrap transition-[background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/15 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

export const BTN_PRIMARY = `${BASE} bg-neutral-950 text-white hover:bg-neutral-800`
export const BTN_SECONDARY = `${BASE} border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50`
// LINE連携のボタン（LINEのブランドカラー）
export const BTN_LINE = `${BASE} bg-[#06C755] text-white hover:bg-[#05b34d] focus-visible:ring-[#06C755]/30`

export const FIELD =
  "block h-11 w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-3.5 text-base text-neutral-950 transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 hover:border-neutral-400 focus-visible:border-neutral-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/10 read-only:border-neutral-200 read-only:bg-neutral-50 read-only:text-neutral-500 read-only:hover:border-neutral-200 aria-invalid:border-red-600 aria-invalid:focus-visible:border-red-600 aria-invalid:focus-visible:ring-red-600/15"

export const TEXTAREA = `${FIELD} h-auto py-2.5 leading-relaxed`

// ファイルを選ぶ欄（ブラウザ標準の「ファイルを選択」ボタンを、枠の中の小さなボタンに見せる）
export const FILE_FIELD =
  "block w-full min-w-0 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-2 text-sm text-neutral-600 transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/10 disabled:opacity-50 file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:text-sm file:font-medium file:text-neutral-900"

// Base UI の Select の見た目を FIELD にそろえる
export const SELECT_TRIGGER =
  "w-full rounded-lg border-neutral-300 bg-white pl-3.5 pr-3 text-base text-neutral-950 hover:border-neutral-400 focus-visible:border-neutral-950 focus-visible:ring-4 focus-visible:ring-neutral-950/10 data-placeholder:text-neutral-400 data-[size=default]:h-11 aria-invalid:border-red-600 aria-invalid:ring-0"

export const PANEL = "rounded-xl border border-neutral-200 bg-white"
