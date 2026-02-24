# Feature: User Authentication

## Goal
As a user I want to be able to log in to the app with my credentials.
Create account using email and password as well as with facebook OAuth.

## Implementation Plan

### What already exists
- Better Auth is installed and configured with `emailAndPassword: { enabled: true }` (`lib/auth.ts`)
- The auth API catch-all route is wired up at `app/api/auth/[...all]/route.ts`
- Prisma schema already includes all Better Auth required tables: `user`, `session`, `account`, `verification`
- `lib/auth-client.ts` exports `authClient` for client-side use

### What needs to be built

**1. Facebook OAuth — server config**
Add `socialProviders.facebook` to `lib/auth.ts` using `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` env vars.

**2. Environment variables**
Add `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` to `.env.local`. The Facebook app's redirect URI must be set to `http://localhost:3000/api/auth/callback/facebook` in the Facebook Developer Portal.

**3. Install shadcn components**
Run: `npx shadcn@latest add @shadcn/card @shadcn/form @shadcn/input @shadcn/label @shadcn/separator`
- `Card` / `CardHeader` / `CardContent` — page wrapper/container for each auth page
- `Form` / `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormMessage` — react-hook-form + zod validation wrappers
- `Input` — email, password, and name fields
- `Label` — accessible field labels (also used via `FormLabel`)
- `Separator` — visual divider between the email/password form and the "Continue with Facebook" button
- `Button` — already installed; used for submit and OAuth actions

**4. Sign-up page — `/app/signup/page.tsx`**
Client component. Layout: `Card` centred on screen containing a `Form` (react-hook-form + zod schema: name, email, password). On valid submit calls `authClient.signUp.email()`. A `Separator` with "or" text divides the form from a full-width `Button` that calls `authClient.signIn.social({ provider: "facebook" })`. Redirects to `/dashboard` on success.

**5. Sign-in page — `/app/signin/page.tsx`**
Client component. Same layout as sign-up but form fields are email and password only. On valid submit calls `authClient.signIn.email()`. Same `Separator` + Facebook `Button` pattern. Redirects to `/dashboard` on success.

**6. Protected dashboard — `/app/dashboard/page.tsx`**
Server component that reads the session via `auth.api.getSession()`. Redirects to `/signin` if no session. Displays basic user info in a `Card` and a sign-out `Button`.

**6. Middleware — `middleware.ts`**
Use `auth.api.getSession()` (or a helper) in Next.js middleware to protect `/dashboard/*` routes and redirect unauthenticated users to `/signin`.

## Task Breakdown
- [x] Add Facebook OAuth to `lib/auth.ts` and update `.env.local` with `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`
- [x] Install shadcn components: `npx shadcn@latest add @shadcn/card @shadcn/form @shadcn/input @shadcn/label @shadcn/separator`
- [x] Build sign-up page at `/app/signup/page.tsx` (Card + Form with zod + Facebook button)
- [x] Build sign-in page at `/app/signin/page.tsx` (Card + Form with zod + Facebook button)
- [x] Build protected dashboard page at `/app/dashboard/page.tsx` with session check and sign-out
- [x] Add `middleware.ts` to protect `/dashboard` routes and redirect unauthenticated users

