import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getFbAccessToken, getAdAccounts } from "@/lib/facebook"
import { encrypt } from "@/lib/encryption"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.redirect(new URL("/dashboard/projects", req.url))
  }

  try {
    const accessToken = await getFbAccessToken(session.user.id)
    const accounts = await getAdAccounts(accessToken)
    const activeAccounts = accounts.filter((a) => a.account_status === 1)

    if (activeAccounts.length === 0) {
      const url = new URL(`/chat/${projectId}`, req.url)
      url.searchParams.set("fb_error", "no_accounts")
      return NextResponse.redirect(url)
    }

    if (activeAccounts.length === 1) {
      await saveFbAccountId(session.user.id, activeAccounts[0].id)
      return NextResponse.redirect(new URL(`/chat/${projectId}`, req.url))
    }

    // Multiple accounts — store list in encrypted cookie, redirect to picker
    const pending = encrypt(JSON.stringify({ accounts: activeAccounts }))
    const url = new URL(`/chat/${projectId}/select-account`, req.url)
    const res = NextResponse.redirect(url)
    res.cookies.set("fb_pending_connection", pending, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    })
    return res
  } catch (err) {
    console.error("Facebook post-connect error:", err)
    const url = new URL(`/chat/${projectId}`, req.url)
    url.searchParams.set("fb_error", "auth_failed")
    return NextResponse.redirect(url)
  }
}

async function saveFbAccountId(userId: string, fbAccountId: string) {
  await prisma.facebookConnection.upsert({
    where: { userId },
    create: { userId, fbAccountId },
    update: { fbAccountId },
  })
}
