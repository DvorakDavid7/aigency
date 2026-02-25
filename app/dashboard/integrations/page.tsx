import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { FacebookIntegrationCard } from "@/components/dashboard/facebook-integration-card"

export default async function IntegrationsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  const [fbAccount, fbConnection] = await Promise.all([
    prisma.account.findFirst({
      where: { userId: session!.user.id, providerId: "facebook" },
      select: { createdAt: true },
    }),
    prisma.facebookConnection.findUnique({
      where: { userId: session!.user.id },
      select: { fbAccountId: true },
    }),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the external accounts connected to Aigency.
        </p>
      </div>

      <FacebookIntegrationCard
        connected={!!fbAccount}
        connectedSince={fbAccount?.createdAt.toISOString() ?? null}
        fbAccountId={fbConnection?.fbAccountId ?? null}
      />
    </div>
  )
}
