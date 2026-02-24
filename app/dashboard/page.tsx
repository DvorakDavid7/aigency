import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SignOutButton from "./sign-out-button"

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/signin")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
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
          </div>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  )
}
