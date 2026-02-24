import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const plans = [
  {
    name: "Starter",
    price: "$10",
    credits: "100 credits",
    perCredit: "$0.10 / credit",
    description: "Trying it out.",
    features: [
      "100 AI actions",
      "Campaign generation",
      "Ad copy creation",
      "Optimization runs",
    ],
    cta: "Buy credits",
    href: "/signup",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Growth",
    price: "$40",
    credits: "500 credits",
    perCredit: "$0.08 / credit",
    description: "Running campaigns.",
    features: [
      "500 AI actions",
      "Campaign generation",
      "Ad copy creation",
      "Optimization runs",
    ],
    cta: "Buy credits",
    href: "/signup",
    variant: "default" as const,
    highlight: true,
  },
  {
    name: "Pro",
    price: "$99",
    credits: "1,500 credits",
    perCredit: "$0.07 / credit",
    description: "Scaling up.",
    features: [
      "1,500 AI actions",
      "Campaign generation",
      "Ad copy creation",
      "Optimization runs",
    ],
    cta: "Buy credits",
    href: "/signup",
    variant: "outline" as const,
    highlight: false,
  },
]

export default function PricingSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Pay as you go</h2>
          <p className="mt-2 text-muted-foreground">
            Buy credits and use them when you need. No subscriptions, no commitments.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? "border-primary shadow-md" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.highlight && (
                    <Badge>Best value</Badge>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="ml-2 text-muted-foreground">{plan.credits}</span>
                </div>
                <CardDescription>{plan.perCredit} — {plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant={plan.variant} className="w-full" asChild>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          1 credit = 1 AI action (campaign generation, ad optimization, or creative generation)
        </p>
      </div>
    </section>
  )
}
