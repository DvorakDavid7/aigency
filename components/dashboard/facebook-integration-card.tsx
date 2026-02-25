"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Facebook, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { authClient } from "@/lib/auth-client"

type Props = {
  connected: boolean
  connectedSince: string | null
  fbAccountId: string | null
}

export function FacebookIntegrationCard({ connected, connectedSince, fbAccountId }: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    setDisconnecting(true)
    await fetch("/api/integrations/facebook", { method: "DELETE" })
    router.refresh()
    setDisconnecting(false)
  }

  function handleConnect() {
    authClient.linkSocial({
      provider: "facebook",
      callbackURL: "/facebook/select-account",
    })
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1877F2]/10">
          <Facebook className="h-5 w-5 text-[#1877F2]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">Facebook</p>
            {connected ? (
              <Badge variant="secondary" className="text-xs text-green-600 bg-green-100">
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Not connected
              </Badge>
            )}
          </div>
          {connected ? (
            <div className="space-y-0.5">
              {fbAccountId ? (
                <p className="text-sm text-muted-foreground">
                  Ad account: <span className="font-mono">{fbAccountId}</span>
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  Connected — no ad account selected yet
                </p>
              )}
              {connectedSince && (
                <p className="text-xs text-muted-foreground">
                  Connected {new Date(connectedSince).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your Facebook account to run ad campaigns.
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        {connected ? (
          <>
            <Button size="sm" variant="outline" onClick={handleConnect}>
              Reconnect
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={handleConnect}>
            <Facebook className="mr-2 h-4 w-4" />
            Connect
          </Button>
        )}
      </div>
    </div>
  )
}
