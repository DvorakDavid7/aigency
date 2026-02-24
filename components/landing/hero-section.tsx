import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="max-w-2xl text-5xl font-bold tracking-tight">
        AI-Powered Facebook Ads — Without the Agency
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Aigency automatically creates, manages, and optimizes your Facebook ad campaigns using AI. Get agency-level results at a fraction of the cost.
      </p>
      <div className="flex items-center gap-3">
        <Button size="lg" asChild>
          <Link href="/signup">Get started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </section>
  )
}
