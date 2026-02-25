"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AdAccount = {
  id: string
  name: string
  account_status: number
  currency: string
}

function SelectAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")

  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/facebook/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data.accounts ?? [])
        setLoading(false)
      })
  }, [])

  async function handleConfirm() {
    if (!selected) return
    setSaving(true)
    await fetch("/api/facebook/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fbAccountId: selected }),
    })
    const dest = projectId ? `/chat/${projectId}` : "/dashboard/integrations"
    router.push(dest)
  }

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No active ad accounts found on this Facebook account.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelected(account.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                selected === account.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.id} · {account.currency}
                  </p>
                </div>
              </div>
              {selected === account.id && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      <Button onClick={handleConfirm} disabled={!selected || saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          "Connect this account"
        )}
      </Button>
    </div>
  )
}

export default function SelectAccountPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Select your ad account</CardTitle>
          <CardDescription>
            Choose which Facebook ad account Aigency should manage for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <SelectAccountContent />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
