"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

type Props = {
  asMenuItem?: boolean
}

export default function SignOutButton({ asMenuItem = false }: Props) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/login")
  }

  if (asMenuItem) {
    return (
      <button
        onClick={handleSignOut}
        className="w-full cursor-default select-none rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Sign out
      </button>
    )
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignOut}>
      Sign out
    </Button>
  )
}
