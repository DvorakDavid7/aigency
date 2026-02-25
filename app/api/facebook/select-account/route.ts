import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { decrypt } from "@/lib/encryption"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { accountId, projectId } = await req.json()
  if (!accountId || !projectId) {
    return NextResponse.json({ error: "accountId and projectId are required" }, { status: 400 })
  }

  // Validate the selected account is in the pending list
  const pendingCookie = req.cookies.get("fb_pending_connection")?.value
  if (!pendingCookie) {
    return NextResponse.json({ error: "No pending connection found" }, { status: 400 })
  }

  let pending: { accounts: { id: string; name: string }[] }
  try {
    pending = JSON.parse(decrypt(pendingCookie))
  } catch {
    return NextResponse.json({ error: "Invalid session data" }, { status: 400 })
  }

  if (!pending.accounts.find((a) => a.id === accountId)) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 })
  }

  await prisma.facebookConnection.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, fbAccountId: accountId },
    update: { fbAccountId: accountId },
  })

  const res = NextResponse.json({ ok: true, redirectTo: `/chat/${projectId}` })
  res.cookies.delete("fb_pending_connection")
  return res
}
