import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.$transaction([
    prisma.account.deleteMany({
      where: { userId: session.user.id, providerId: "facebook" },
    }),
    prisma.facebookConnection.deleteMany({
      where: { userId: session.user.id },
    }),
  ])

  return NextResponse.json({ ok: true })
}
