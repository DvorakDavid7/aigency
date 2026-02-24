# Feature: User interface

## Goal

Implement the dashboard shell and project-based navigation as shown in the wireframe. The wireframe shows two states:

- **Global view** — left sidebar with: Projects, Team, Integrations, Usage, Billing, Settings. Main area shows a searchable project card grid with a "+ New" button.
- **Project view** — sidebar switches to project-level nav: Overview, Analysis, Marketing, Campaigns, Statistics, Usage, Billing, Settings. Main area shows a breadcrumb, project name, and a statistics panel.

---

## Implementation Plan

### Layout Architecture

The dashboard uses **two nested layouts**:

```
app/dashboard/layout.tsx          ← shell: top navbar + sidebar (global nav)
app/dashboard/projects/[id]/layout.tsx  ← overrides sidebar with project-level nav
```

The sidebar is a **client component** that receives nav items as props, so both layouts can reuse the same visual component with different links.

```
app/dashboard/
  layout.tsx                        ← shell with global sidebar
  page.tsx                          ← redirect → /dashboard/projects
  projects/
    page.tsx                        ← projects list (search + cards)
    new/
      page.tsx                      ← create project form
    [id]/
      layout.tsx                    ← project shell with project sidebar
      page.tsx                      ← project overview + statistics
      campaigns/page.tsx            ← stub (wired up in feature 004)
      analysis/page.tsx             ← stub
      marketing/page.tsx            ← stub
      statistics/page.tsx           ← stub
      usage/page.tsx                ← stub
      settings/page.tsx             ← stub
  credits/page.tsx                  ← existing (Billing nav item links here)
  settings/page.tsx                 ← stub
  usage/page.tsx                    ← stub
```

---

### Data Model (`prisma/schema.prisma`)

Add a `Project` model. A project represents one client/business the user runs ads for.

```prisma
model Project {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@map("project")
}
```

Add `projects Project[]` to the `User` model.

Run `npm run db:push` + `npm run db:generate` after schema changes.

---

### shadcn/ui Components to Install

```bash
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
```

- `avatar` — user avatar circle in top navbar
- `dropdown-menu` — user menu (sign out, settings)

---

### Components to Build

#### `components/dashboard/sidebar.tsx` (client component)

Renders the left sidebar. Accepts a `items` prop (array of `{ label, href, icon? }`). Uses `usePathname` to highlight the active item.

```
props:
  items: { label: string; href: string }[]
```

Styling: dark background, full height, fixed width (~180px), vertically stacked nav links. Active item gets a subtle highlight. Matches the wireframe's left panel.

#### `components/dashboard/top-navbar.tsx` (server component)

Top bar across the full width. Three zones:
- **Left:** "Aigency" brand text (links to `/dashboard/projects`)
- **Center/Right:** notifications bell icon button + user `Avatar` with `DropdownMenu` (Sign out, Settings)

Receives `user: { name, email, image }` as props from the layout (which fetches the session server-side).

#### `components/dashboard/project-card.tsx` (client component)

Card rendered in the projects grid. Shows project name. Clicking navigates to `/dashboard/projects/[id]`. Uses the existing shadcn `Card` component.

---

### Pages to Build

#### `app/dashboard/layout.tsx`
Server component. Fetches session (redirect to `/login` if missing). Renders:
- `TopNavbar` with user info
- `Sidebar` with global nav items:
  - Projects → `/dashboard/projects`
  - Team → `/dashboard/team` (stub)
  - Integrations → `/dashboard/integrations` (stub)
  - Usage → `/dashboard/usage` (stub)
  - Billing → `/dashboard/credits`
  - Settings → `/dashboard/settings` (stub)
- `{children}` in the main content area

Replaces the existing `app/dashboard/page.tsx` auth guard — session check moves here so all child pages are automatically protected.

#### `app/dashboard/page.tsx`
Simple redirect to `/dashboard/projects`.

#### `app/dashboard/projects/page.tsx`
Server component. Fetches all projects for the current user from DB.

Renders:
- Heading "Projects"
- Search input (client-side filter) + "+ New" button → `/dashboard/projects/new`
- Responsive card grid of `ProjectCard` components (3 columns on desktop, 2 on tablet, 1 on mobile)
- Empty state with CTA if no projects exist yet

#### `app/dashboard/projects/new/page.tsx`
Client component. Simple form with a single required field: project name (+ optional description). On submit: `POST /api/projects` → creates project in DB → redirects to `/dashboard/projects/[id]`.

Needs a new API route: `app/api/projects/route.ts` (POST handler).

#### `app/dashboard/projects/[id]/layout.tsx`
Server component. Fetches the project by ID (404 if not found or belongs to different user). Renders the same shell structure but with project-level sidebar:

- Overview → `/dashboard/projects/[id]`
- Analysis → `/dashboard/projects/[id]/analysis`
- Marketing → `/dashboard/projects/[id]/marketing`
- Campaigns → `/dashboard/projects/[id]/campaigns`
- Statistics → `/dashboard/projects/[id]/statistics`
- Usage → `/dashboard/projects/[id]/usage`
- Billing → `/dashboard/projects/[id]/billing`
- Settings → `/dashboard/projects/[id]/settings`

Also renders a breadcrumb: `projects > {project.name}`.

#### `app/dashboard/projects/[id]/page.tsx`
Server component. Shows project name as heading + a placeholder statistics panel (dark card with "Statistics" label, matching the wireframe). Will be wired up with real data in a later feature.

#### Stub pages
All other project sub-pages (`analysis`, `marketing`, `campaigns`, `statistics`, `usage`, `settings`) and global pages (`/dashboard/usage`, `/dashboard/settings`) are simple server components that render a heading and "Coming soon" text. They exist purely to make the navigation links functional.

---

### File Summary

| File | Type | Purpose |
|------|------|---------|
| `prisma/schema.prisma` | Schema | Add Project model |
| `components/dashboard/top-navbar.tsx` | Server | Brand + notifications + user menu |
| `components/dashboard/sidebar.tsx` | Client | Context-aware nav sidebar |
| `components/dashboard/project-card.tsx` | Client | Project card in grid |
| `app/dashboard/layout.tsx` | Server | Dashboard shell + global nav |
| `app/dashboard/page.tsx` | Server | Redirect to /projects |
| `app/dashboard/projects/page.tsx` | Server | Projects list |
| `app/dashboard/projects/new/page.tsx` | Client | Create project form |
| `app/api/projects/route.ts` | API | POST create project |
| `app/dashboard/projects/[id]/layout.tsx` | Server | Project shell + project nav |
| `app/dashboard/projects/[id]/page.tsx` | Server | Project overview |
| `app/dashboard/projects/[id]/campaigns/page.tsx` | Server | Stub |
| `app/dashboard/projects/[id]/analysis/page.tsx` | Server | Stub |
| `app/dashboard/projects/[id]/marketing/page.tsx` | Server | Stub |
| `app/dashboard/projects/[id]/statistics/page.tsx` | Server | Stub |
| `app/dashboard/projects/[id]/usage/page.tsx` | Server | Stub |
| `app/dashboard/projects/[id]/settings/page.tsx` | Server | Stub |
| `app/dashboard/usage/page.tsx` | Server | Stub |
| `app/dashboard/settings/page.tsx` | Server | Stub |

---

## Task Breakdown

- [x] Add `Project` model to Prisma schema; add `projects` relation to `User`; run `db:push` + `db:generate`
- [x] Install shadcn `avatar` and `dropdown-menu` components
- [x] Build `components/dashboard/top-navbar.tsx` (brand, notifications, user avatar + dropdown)
- [x] Build `components/dashboard/sidebar.tsx` (reusable nav list, active state via `usePathname`)
- [x] Build `components/dashboard/project-card.tsx`
- [x] Build `app/dashboard/layout.tsx` (shell + global sidebar, replaces auth guard in page.tsx)
- [x] Build `app/dashboard/projects/page.tsx` (project list + search + grid)
- [x] Build `app/dashboard/projects/new/page.tsx` + `app/api/projects/route.ts`
- [x] Build `app/dashboard/projects/[id]/layout.tsx` (project shell + breadcrumb + project sidebar)
- [x] Build `app/dashboard/projects/[id]/page.tsx` (overview + statistics placeholder)
- [x] Add all stub pages (project sub-pages + global settings/usage)
