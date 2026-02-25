import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projectId = req.nextUrl.searchParams.get("projectId") ?? ""

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/facebook/callback`,
    scope: "email,public_profile,ads_management,ads_read,read_insights,pages_show_list",
    response_type: "code",
    state: projectId,
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v24.0/dialog/oauth?${params}`
  )
}
