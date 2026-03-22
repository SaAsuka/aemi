import { Resend } from "resend"

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const FROM = "VOZEL <noreply@vozel.jp>"

export async function sendInviteEmail(email: string, token: string) {
  const url = `${APP_URL}/auth/invite?token=${token}`
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "VOZELへの招待",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">VOZELへようこそ</h2>
        <p>以下のリンクをクリックして登録を完了してください。</p>
        <a href="${url}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">登録を完了する</a>
        <p style="color: #666; font-size: 14px;">このリンクは24時間有効です。</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/auth/reset-password?token=${token}`
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "VOZELパスワード設定",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">パスワード設定</h2>
        <p>以下のリンクをクリックしてパスワードを設定してください。</p>
        <a href="${url}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">パスワードを設定する</a>
        <p style="color: #666; font-size: 14px;">このリンクは1時間有効です。</p>
      </div>
    `,
  })
}
