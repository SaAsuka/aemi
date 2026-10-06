// 文字をクリップボードにコピーする。コピーできたら true
//
// 1. Clipboard API（https の通常のブラウザ）
// 2. だめなら昔ながらの execCommand("copy")（LINE内のブラウザや古いiOSなど、1が使えない環境向け）
// どちらも失敗したら false を返すので、呼び出し側で「長押しでコピーしてください」と文字を見せる
//
// container：一時的な入力欄を置く場所。ダイアログの中から呼ぶときはダイアログ内の要素を渡す
// （ダイアログ外に置くとフォーカスを奪い返されてコピーできないことがあるため）
export async function copyText(text: string, container?: HTMLElement | null): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 権限が無い・ブラウザが拒否した → 次の方法へ
    }
  }
  // 押したメニューが閉じて要素が消えていることがあるので、そのときは body に置く
  return legacyCopy(text, container?.isConnected ? container : document.body)
}

function legacyCopy(text: string, container: HTMLElement): boolean {
  const previousFocus = document.activeElement as HTMLElement | null
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  // 画面には見せない。iOSで拡大されないよう文字は16px
  textarea.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none"
  container.appendChild(textarea)
  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
    previousFocus?.focus?.()
  }
}
