# Next.js + Prisma + Better Auth Starter

A starter template with [Next.js](https://nextjs.org) 16, [Prisma](https://www.prisma.io/) 7, and [Better Auth](https://www.better-auth.com/) pre-configured and wired together.

## Tech Stack

- **Next.js 16** — App Router, React 19, Tailwind CSS v4
- **Prisma 7** — ORM with SQLite (default) and PostgreSQL adapters included
- **Better Auth** — Email/password authentication out of the box
- **shadcn/ui** — Component library (Radix UI + Tailwind)

## Project Structure

```
app/
├── api/auth/[...all]/route.ts   # Better Auth catch-all API route
├── generated/prisma/            # Generated Prisma client
├── layout.tsx
├── page.tsx
lib/
├── auth.ts                      # Better Auth server config (Prisma adapter)
├── auth-client.ts               # Better Auth React client
├── prisma.ts                    # Prisma client singleton
prisma/
├── schema.prisma                # Database schema (User, Session, Account, Verification)
├── seed.ts                      # Database seed script
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file with your database URL:

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="your-secret-here"
```

### 3. Push the schema and generate the client

```bash
npm run db:push
npm run db:generate
```

### 4. (Optional) Seed the database

```bash
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Commands

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `npm run db:generate`    | Generate Prisma client             |
| `npm run db:push`        | Push schema to database            |
| `npm run db:seed`        | Seed the database                  |
| `npm run db:studio`      | Open Prisma Studio                 |
| `npm run db:migrate`     | Create and apply a migration       |
| `npm run db:migrate:deploy` | Apply pending migrations        |
| `npm run db:migrate:reset`  | Reset database and re-apply migrations |

## Switching to PostgreSQL

The Prisma client in `lib/prisma.ts` includes both SQLite and PostgreSQL adapters. To switch:

1. Update `prisma/schema.prisma` — change `provider = "sqlite"` to `provider = "postgresql"`
2. Update `lib/prisma.ts` — swap `sqliteAdapter` for `pgAdapter`
3. Update `lib/auth.ts` — change the provider to `"postgresql"`
4. Set `DATABASE_URL` to your PostgreSQL connection string
