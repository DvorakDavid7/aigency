export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  priceDisplay: string;
  stripePriceId: string;
  highlight: boolean;
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    price: 1000,
    priceDisplay: "$10",
    stripePriceId: process.env.STRIPE_PRICE_STARTER!,
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    credits: 500,
    price: 4000,
    priceDisplay: "$40",
    stripePriceId: process.env.STRIPE_PRICE_GROWTH!,
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 1500,
    price: 9900,
    priceDisplay: "$99",
    stripePriceId: process.env.STRIPE_PRICE_PRO!,
    highlight: false,
  },
];
