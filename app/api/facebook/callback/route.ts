import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  }

  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const projectId = searchParams.get("state") ?? ""
  const error = searchParams.get("error")

  if (error || !code) {
    const dest = projectId ? `/chat/${projectId}` : "/dashboard"
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${dest}?error=facebook_denied`
    )
  }

  // Exchange code for access token
  const tokenParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/facebook/callback`,
    code,
  })

  const tokenRes = await fetch(
    `https://graph.facebook.com/v24.0/oauth/access_token?${tokenParams}`
  )
  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_token_failed`
    )
  }

  // Save token — upsert so reconnecting works
  await prisma.facebookConnection.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, accessToken: tokenData.access_token },
    update: { accessToken: tokenData.access_token, fbAccountId: null },
  })

  // Redirect to account selection
  const dest = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/facebook/select-account`)
  if (projectId) dest.searchParams.set("projectId", projectId)

  return NextResponse.redirect(dest)
}
