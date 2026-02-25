import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { FacebookAdsApi, User } from "facebook-nodejs-business-sdk"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the Facebook access token stored by Better Auth
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "facebook" },
    select: { accessToken: true },
  })

  if (!account?.accessToken) {
    return NextResponse.json({ error: "No Facebook account connected" }, { status: 400 })
  }

  // Init the SDK with the user's token
  FacebookAdsApi.init(account.accessToken)

  // Fetch the user's ad accounts
  const me = new User("me")
  const adAccounts = await me.getAdAccounts(["id", "name", "account_status", "currency"])

  return NextResponse.json({ adAccounts })
}
