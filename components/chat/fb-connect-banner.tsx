"use client"

import { Facebook, Loader2, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Props = {
  projectId: string
  error?: string | null
}

export function FbConnectBanner({ projectId, error }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [connecting, setConnecting] = useState(false)

  if (dismissed) return null

  async function handleConnect() {
    setConnecting(true)
    await authClient.oauth2.link({
      providerId: "facebook-ads",
      callbackURL: `/api/facebook/post-connect?projectId=${projectId}`,
    })
    // Better Auth redirects automatically — no need to reset state
  }

  return (
    <div className="shrink-0 border-b border-border bg-muted/30 px-6 py-4">
      <div className="mx-auto max-w-2xl flex items-start gap-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Facebook className="h-4 w-4 text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          {error === "no_accounts" ? (
            <>
              <p className="text-sm font-medium">No active ad accounts found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your Facebook account doesn't have any active ad accounts. Create one in{" "}
                <a
                  href="https://business.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Facebook Business Manager
                </a>{" "}
                then try again.
              </p>
            </>
          ) : error === "auth_failed" ? (
            <>
              <p className="text-sm font-medium">Connection failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                Something went wrong connecting your Facebook account. Please try again.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Connect your Facebook Ads account</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aigency needs access to manage campaigns on your behalf. Your ad spend goes
                directly to Facebook — we never touch your budget.
              </p>
            </>
          )}

          <div className="mt-3">
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Facebook className="h-3.5 w-3.5" />
              )}
              {error ? "Try again" : "Connect Facebook"}
            </Button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
