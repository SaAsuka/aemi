"use client"

import { useState } from "react"
import { createApplication } from "@/lib/actions/application"
import { Button } from "@/components/ui/button"

export function JobApplicationForm({
  jobId,
  talentId,
  talentName,
}: {
  jobId: string
  talentId: string
  talentName: string
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleApply = async () => {
    setStatus("loading")
    const formData = new FormData()
    formData.set("talentId", talentId)
    formData.set("jobId", jobId)
    formData.set("status", "APPLIED")

    const result = await createApplication(formData)

    if ("error" in result && result.error) {
      setStatus("error")
      const err = result.error
      if (typeof err === "string") {
        setMessage(err)
      } else {
        const values: string[] = []
        for (const v of Object.values(err)) {
          if (v) values.push(...v)
        }
        setMessage(values.join(", ") || "エラーが発生しました")
      }
    } else {
      setStatus("success")
      setMessage(`${talentName}さんの応募が完了しました`)
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-800 text-sm">{message}</p>
        </div>
      )}
      <Button
        onClick={handleApply}
        disabled={status === "loading"}
        className="w-full"
        size="lg"
      >
        {status === "loading" ? "送信中..." : "応募する"}
      </Button>
    </div>
  )
}
