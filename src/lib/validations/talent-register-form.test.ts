import { describe, it, expect } from "vitest"
import { validateTalentTabFields, validateBankTabFields } from "./talent-register-form"

describe("validateTalentTabFields", () => {
  const validData = {
    lastName: "山田",
    firstName: "太郎",
    lastNameKana: "ヤマダ",
    firstNameKana: "タロウ",
    email: "test@example.com",
    password: "password123",
    passwordConfirm: "password123",
  }

  it("すべて正しく入力されていればエラーなし", () => {
    expect(validateTalentTabFields(validData)).toEqual({})
  })

  it("姓が未入力ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, lastName: "" })
    expect(errors.lastName).toEqual(["必須項目です"])
  })

  it("名が未入力ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, firstName: "" })
    expect(errors.firstName).toEqual(["必須項目です"])
  })

  it("セイが未入力ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, lastNameKana: "" })
    expect(errors.lastNameKana).toEqual(["必須項目です"])
  })

  it("メイが未入力ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, firstNameKana: "" })
    expect(errors.firstNameKana).toEqual(["必須項目です"])
  })

  it("姓が空白のみならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, lastName: "   " })
    expect(errors.lastName).toEqual(["必須項目です"])
  })

  it("メールアドレスが未入力ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, email: "" })
    expect(errors.email).toEqual(["メールアドレスは必須です"])
  })

  it("メールアドレスの形式が不正ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, email: "not-an-email" })
    expect(errors.email).toEqual(["メールアドレスの形式が不正です"])
  })

  it("パスワードが8文字未満ならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, password: "short12", passwordConfirm: "short12" })
    expect(errors.password).toEqual(["パスワードは8文字以上で入力してください"])
  })

  it("パスワードがちょうど8文字ならエラーなし", () => {
    const errors = validateTalentTabFields({ ...validData, password: "12345678", passwordConfirm: "12345678" })
    expect(errors.password).toBeUndefined()
  })

  it("パスワードとパスワード確認が一致しないならエラー", () => {
    const errors = validateTalentTabFields({ ...validData, passwordConfirm: "different123" })
    expect(errors.passwordConfirm).toEqual(["パスワードが一致しません"])
  })

  it("複数項目が未入力なら複数のエラーを返す", () => {
    const errors = validateTalentTabFields({ ...validData, lastName: "", email: "" })
    expect(Object.keys(errors).sort()).toEqual(["email", "lastName"])
  })
})

describe("validateBankTabFields", () => {
  it("現状は必須項目がないため常にエラーなし", () => {
    expect(validateBankTabFields({})).toEqual({})
  })
})
