"use client"

import { Button } from "@/components/ui/button"

export function FreeeConnectButton({ connected }: { connected: boolean }) {
  return (
    <a href="/api/freee/auth">
      <Button variant={connected ? "outline" : "default"}>
        {connected ? "再連携する" : "Freeeと連携する"}
      </Button>
    </a>
  )
}
