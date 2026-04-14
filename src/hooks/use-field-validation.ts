"use client"

import { useState, useCallback } from "react"
import type { ZodType } from "zod"

type FieldErrors = Record<string, string | undefined>

export function useFieldValidation(schema: ZodType) {
  const [errors, setErrors] = useState<FieldErrors>({})

  const validateField = useCallback(
    (name: string, value: string) => {
      const result = schema.safeParse({ [name]: value })
      if (result.success) {
        setErrors((prev) => {
          if (!prev[name]) return prev
          const next = { ...prev }
          delete next[name]
          return next
        })
      } else {
        const allErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>
        const fieldError = allErrors[name]
        if (fieldError?.[0]) {
          setErrors((prev) => ({ ...prev, [name]: fieldError[0] }))
        }
      }
    },
    [schema],
  )

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  return { errors, validateField, clearError }
}
