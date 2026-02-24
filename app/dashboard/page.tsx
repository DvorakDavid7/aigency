import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SignOutButton from "./sign-out-button"

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  })

  const credits = user?.credits ?? 0

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>You are signed in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Name: </span>
              {session.user.name}
            </p>
            <p>
              <span className="text-muted-foreground">Email: </span>
              {session.user.email}
            </p>
            <p>
              <span className="text-muted-foreground">Credits: </span>
              {credits}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/credits">Buy credits</Link>
          </Button>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  )
}
