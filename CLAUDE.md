# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The business description is written here: @docs/product.md

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

For third-party library documentation, use context7.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Regenerate Prisma client (run after schema changes)
npm run db:push      # Push schema to DB (no migration file)
npm run db:migrate   # Create + apply migration
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio UI
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."   # PostgreSQL connection string
BETTER_AUTH_SECRET="..."          # Auth secret key
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, Prisma 7, Better Auth, Tailwind CSS v4, shadcn/ui

### Key files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Better Auth server config with Prisma adapter (provider: postgresql) |
| `lib/auth-client.ts` | Better Auth React client (`authClient`) |
| `lib/prisma.ts` | Prisma singleton — currently uses `pgAdapter`; `sqliteAdapter` is defined but unused |
| `lib/logger.ts` | `logError()` writes to `ErrorLog` DB table |
| `instrumentation.ts` | Next.js `onRequestError` hook — captures all server-side errors to DB |
| `app/error.tsx` | Client error boundary — POSTs errors to `/api/log/error` |
| `app/global-error.tsx` | Root-level client error boundary |
| `app/api/log/error/route.ts` | API route that receives client errors and calls `logError()` |
| `app/dashboard/errors/page.tsx` | Admin view of the last 50 error logs |

### Prisma client location

The Prisma client is generated to `lib/generated/prisma` (not the default `node_modules`). Import from `./generated/prisma/client` (as in `lib/prisma.ts`), not from `@prisma/client`.

### Error logging flow

- **Server errors**: `instrumentation.ts` → `logError()` → `ErrorLog` table
- **Client errors**: `app/error.tsx` → `POST /api/log/error` → `logError()` → `ErrorLog` table
- **View logs**: `/dashboard/errors`

### Database

Currently configured for PostgreSQL throughout (`prisma/schema.prisma`, `lib/prisma.ts`, `lib/auth.ts`). To switch to SQLite, update all three files per the README instructions.
