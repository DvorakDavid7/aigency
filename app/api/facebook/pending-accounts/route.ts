import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/encryption"

export async function GET(req: NextRequest) {
  const pendingCookie = req.cookies.get("fb_pending_connection")?.value
  if (!pendingCookie) {
    return NextResponse.json({ error: "No pending connection" }, { status: 404 })
  }

  try {
    const pending = JSON.parse(decrypt(pendingCookie))
    // Only expose the account list — never the token
    return NextResponse.json({
      accounts: pending.accounts.map((a: { id: string; name: string }) => ({
        id: a.id,
        name: a.name,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 })
  }
}
