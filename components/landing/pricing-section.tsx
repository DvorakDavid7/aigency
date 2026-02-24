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
    name: "Free",
    price: "$0",
    description: "Get started at no cost.",
    features: ["10 agent runs / month", "1 workspace", "Community support"],
    cta: "Get started",
    href: "/signup",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    description: "For individuals who move fast.",
    features: [
      "500 agent runs / month",
      "Unlimited workspaces",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Get started",
    href: "/signup",
    variant: "default" as const,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams with custom needs.",
    features: [
      "Unlimited agent runs",
      "SSO & advanced security",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact sales",
    href: "mailto:sales@aigency.ai",
    variant: "outline" as const,
    highlight: false,
  },
]

export default function PricingSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">
            Start free. Scale as you grow.
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
                    <Badge>Most popular</Badge>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground">/mo</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
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
      </div>
    </section>
  )
}
