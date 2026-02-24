# Feature: Stripe pricing

## Goal
Implement stripe pricing. 
Use better auth plugin for the implementation.
Sync Users with stripe customers. 
Application will be in pay as you go mode right now so you users should be able to buy credits to use the apps features.
No subscriptions for now


## Implementation Plan

### Plugin scope
The `@better-auth/stripe` plugin handles **customer management** and **webhooks** — it auto-creates a Stripe customer for every new user and verifies incoming webhook signatures. Its built-in subscription and credit/usage billing features are **not used** here (no subscriptions; credits/usage billing is still on the plugin's roadmap and not released).

Credits are managed with a custom `credits` column on the `User` table. Purchasing credits goes through a standard Stripe **Checkout one-time payment** session; the `checkout.session.completed` webhook increments the user's balance.

### What needs to be built

**1. Install packages**
```
npm install @better-auth/stripe stripe@^20.0.0
```

**2. Environment variables**
Add to `.env`:
```
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

**3. Add `credits` to Prisma schema (`prisma/schema.prisma`)**
Add `stripeCustomerId String?` and `credits Int @default(0)` to the `User` model, then run `npm run db:migrate`.

**4. Configure the plugin in `lib/auth.ts`**
- Import `stripe` from `@better-auth/stripe` and `Stripe` from `stripe`
- Add plugin with `createCustomerOnSignUp: true` so every new user gets a Stripe customer automatically
- Use `onCustomerCreate` to persist the Stripe `customer.id` back to `user.stripeCustomerId` via Prisma
- Use `onEvent` to handle `checkout.session.completed`: look up the user by `stripeCustomerId`, increment their `credits` by the purchased amount (stored in `metadata.credits` on the Checkout session)

**5. Add the client plugin to `lib/auth-client.ts`**
Import `stripeClient` from `@better-auth/stripe/client` and add it to `createAuthClient` (subscriptions disabled).

**6. Migrate the database**
Run `npx @better-auth/cli generate` to add the `stripeCustomer` table the plugin requires, then `npm run db:migrate` for the `credits` column.

**7. Define credit packages — `lib/stripe-packages.ts`**
A typed constant listing purchasable packages, e.g.:
| Package | Credits | Price | Stripe Price ID env var |
|---------|---------|-------|------------------------|
| Starter | 100 | $9 | `STRIPE_PRICE_STARTER` |
| Growth | 500 | $39 | `STRIPE_PRICE_GROWTH` |
| Pro | 1500 | $99 | `STRIPE_PRICE_PRO` |

**8. Checkout API route — `app/api/credits/checkout/route.ts`**
POST handler (authenticated). Accepts `{ packageId }`, creates a Stripe Checkout session (`mode: "payment"`, `customer: user.stripeCustomerId`) with `metadata: { userId, credits }` and returns the session URL. Client redirects to it.

**9. Buy credits UI — `app/dashboard/credits/page.tsx`**
Server component showing the user's current credit balance (from session/DB). Lists the three packages as `Card` components (using existing shadcn `Card` + `Button`). Each "Buy" button POSTs to `/api/credits/checkout` and redirects to Stripe Checkout. After payment Stripe redirects back to `/dashboard/credits?success=true`.

**10. Webhook endpoint**
The plugin mounts the webhook handler automatically at `/api/auth/stripe/webhook`. Register this URL in the Stripe Dashboard with at least the `checkout.session.completed` event.

### Data flow
```
User clicks "Buy" → POST /api/credits/checkout
  → Stripe Checkout session created (with metadata.credits)
  → User pays on Stripe
  → Stripe fires checkout.session.completed
  → onEvent handler → increment user.credits in DB
  → User redirected to /dashboard/credits?success=true
```

## Task Breakdown
- [x] Install `@better-auth/stripe` and `stripe` packages; add env vars to `.env` and `.env.example`
- [x] Add `stripeCustomerId` and `credits` fields to Prisma `User` model and run migration
- [x] Configure `@better-auth/stripe` plugin in `lib/auth.ts` (customer sync + `onEvent` credits webhook)
- [x] Add `stripeClient` plugin to `lib/auth-client.ts`
- [x] Run `npx @better-auth/cli generate` and `npm run db:migrate` to apply all schema changes
- [x] Define credit packages in `lib/stripe-packages.ts` and create Stripe products/prices in dashboard
- [x] Build `app/api/credits/checkout/route.ts` POST handler to create Checkout sessions
- [x] Build `app/dashboard/credits/page.tsx` with balance display and package cards
