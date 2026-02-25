import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { FacebookAdsApi, User } from "facebook-nodejs-business-sdk"

// GET — list the user's ad accounts from Facebook
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read token from Better Auth's account table (stored during Facebook login)
  const fbAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "facebook" },
    select: { accessToken: true },
  })

  if (!fbAccount?.accessToken) {
    return NextResponse.json({ error: "No Facebook account connected" }, { status: 400 })
  }

  FacebookAdsApi.init(fbAccount.accessToken)
  const me = new User("me")
  const accounts = await me.getAdAccounts(["id", "name", "account_status", "currency"])

  return NextResponse.json({ accounts })
}

// POST — save the selected ad account
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fbAccountId } = await req.json()
  if (!fbAccountId) {
    return NextResponse.json({ error: "fbAccountId is required" }, { status: 400 })
  }

  await prisma.facebookConnection.update({
    where: { userId: session.user.id },
    data: { fbAccountId },
  })

  return NextResponse.json({ ok: true })
}
