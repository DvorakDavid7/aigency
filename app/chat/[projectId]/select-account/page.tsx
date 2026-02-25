"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Facebook, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Accounts are passed via cookie and read server-side in a real implementation.
// This page reads them from the cookie via a client-side fetch to keep things simple.
// The actual list is fetched from /api/facebook/pending-accounts.

import { useEffect } from "react"

type AdAccount = {
  id: string
  name: string
}

export default function SelectAccountPage() {
  const router = useRouter()
  const params = useParams<{ projectId: string }>()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/facebook/pending-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (data.accounts) setAccounts(data.accounts)
        else setError("Session expired. Please try connecting again.")
      })
      .catch(() => setError("Failed to load accounts."))
      .finally(() => setLoading(false))
  }, [])

  async function select(accountId: string) {
    setSelecting(accountId)
    setError(null)
    try {
      const res = await fetch("/api/facebook/select-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, projectId: params.projectId }),
      })
      const data = await res.json()
      if (data.redirectTo) {
        router.push(data.redirectTo)
      } else {
        setError(data.error ?? "Something went wrong")
        setSelecting(null)
      }
    } catch {
      setError("Failed to save account selection.")
      setSelecting(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
              <Facebook className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle>Select Ad Account</CardTitle>
          </div>
          <CardDescription>
            You have multiple Facebook Ad Accounts. Select the one you want Aigency to manage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!loading && accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => select(account.id)}
              disabled={selecting !== null}
              className="w-full flex items-center justify-between rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              <div>
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{account.id}</p>
              </div>
              {selecting === account.id && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => router.push(`/chat/${params.projectId}`)}
            disabled={selecting !== null}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
