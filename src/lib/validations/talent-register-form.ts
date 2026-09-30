export type TalentRegisterFormValues = Record<string, FormDataEntryValue | undefined>

// タレント情報タブの必須項目チェック
export function validateTalentTabFields(data: TalentRegisterFormValues): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  if (!String(data.lastName ?? "").trim()) errors.lastName = ["必須項目です"]
  if (!String(data.firstName ?? "").trim()) errors.firstName = ["必須項目です"]
  if (!String(data.lastNameKana ?? "").trim()) errors.lastNameKana = ["必須項目です"]
  if (!String(data.firstNameKana ?? "").trim()) errors.firstNameKana = ["必須項目です"]

  const email = String(data.email ?? "").trim()
  if (!email) errors.email = ["メールアドレスは必須です"]
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ["メールアドレスの形式が不正です"]

  const password = String(data.password ?? "")
  if (password.length < 8) errors.password = ["パスワードは8文字以上で入力してください"]
  if (password !== String(data.passwordConfirm ?? "")) errors.passwordConfirm = ["パスワードが一致しません"]

  return errors
}

// 口座情報タブ（現状必須項目なし）
export function validateBankTabFields(_data: TalentRegisterFormValues): Record<string, string[]> {
  return {}
}
