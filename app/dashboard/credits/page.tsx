"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CREDIT_PACKAGES } from "@/lib/stripe-packages";
import { authClient } from "@/lib/auth-client";

function SuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("success") !== "true") return null;
  return (
    <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
      Payment successful! Your credits have been added to your account.
    </div>
  );
}

function CreditsContent() {
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleBuy(packageId: string) {
    setLoading(packageId);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  if (!session) return null;

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="mt-1 text-muted-foreground">
          Current balance:{" "}
          <span className="font-semibold text-foreground">
            {(session.user as { credits?: number }).credits ?? 0} credits
          </span>
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Buy credits</h2>
        <p className="text-sm text-muted-foreground">
          Pay as you go. No subscriptions, no commitments.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={pkg.highlight ? "border-primary shadow-md" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{pkg.name}</CardTitle>
                {pkg.highlight && <Badge>Best value</Badge>}
              </div>
              <div className="mt-1">
                <span className="text-3xl font-bold">{pkg.priceDisplay}</span>
                <span className="ml-2 text-muted-foreground">
                  {pkg.credits.toLocaleString()} credits
                </span>
              </div>
              <CardDescription>
                ${(pkg.price / pkg.credits / 100).toFixed(2)} / credit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  {pkg.credits.toLocaleString()} AI actions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Campaign generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Ad copy creation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Optimization runs
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant={pkg.highlight ? "default" : "outline"}
                className="w-full"
                disabled={loading === pkg.id}
                onClick={() => handleBuy(pkg.id)}
              >
                {loading === pkg.id ? "Redirecting…" : "Buy credits"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        1 credit = 1 AI action (campaign generation, ad optimization, or
        creative generation)
      </p>
    </>
  );
}

export default function CreditsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Suspense>
        <SuccessBanner />
      </Suspense>
      <CreditsContent />
    </main>
  );
}
