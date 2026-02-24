# Feature: Create langin page

## Goal
As a user I want to be able to visit a landing page.
It should contain a very basic design right now with a call to action layout.
It should contain a pricing section.
It should allow users to log in to the app.

## Implementation Plan

### What already exists
- `app/page.tsx` — placeholder with a single heading; this is where the landing page lives
- `app/layout.tsx` — Geist font, standard root layout
- `/login` and `/signup` routes are already built
- Installed shadcn components: `Button`, `Card`/`CardHeader`/`CardContent`/`CardFooter`, `Separator`

### What needs to be built

**1. Install `Badge` component**
Run: `npx shadcn@latest add badge`
Used to highlight a recommended pricing tier (e.g. "Most popular").

**2. Navbar — `components/navbar.tsx`**
Simple server component. Left: "Aigency" wordmark. Right: "Log in" `Button` (variant `ghost`) linking to `/login` and "Get started" `Button` linking to `/signup`. Sticky at top with a subtle border.

**3. Hero section**
Full-width section centred vertically. Large headline, one-line subheadline, and two CTA buttons: primary "Get started" → `/signup`, outline "Log in" → `/login`.

**4. Pricing section**
Three pricing tiers displayed as a responsive grid of `Card` components:
- **Free** — $0/mo, basic features list, outline "Get started" button
- **Pro** — $19/mo, highlighted with a `Badge` ("Most popular") and a filled "Get started" button
- **Enterprise** — custom pricing, contact-sales CTA

**5. Footer**
Minimal single-line footer with copyright text.

**6. Assemble in `app/page.tsx`**
Replace the placeholder with `<Navbar />`, `<HeroSection />`, `<PricingSection />`, and `<Footer />` stacked in a single server component. Update `app/layout.tsx` metadata (title + description).

## Task Breakdown
- [x] Install `Badge` component: `npx shadcn@latest add badge`
- [x] Build `Navbar` with logo and Login / Get started links
- [x] Build `HeroSection` with headline, subheadline, and CTA buttons
- [x] Build `PricingSection` with three `Card` tiers and `Badge` highlight
- [x] Build `Footer` with copyright text
- [x] Assemble all sections in `app/page.tsx` and update layout metadata
