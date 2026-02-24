# Feature: Create Facebook Marketing Campaign

## Goal

Allow authenticated users to create an AI-generated Facebook ad campaign end-to-end:
1. Connect their Facebook ad account (one-time)
2. Fill in business context (what they sell, who they target, budget)
3. AI generates campaign structure + ad copy
4. Campaign is deployed to Facebook via the Marketing API
5. Campaign appears in their dashboard

This is the core value-delivery feature — it's what users pay credits for.

---

## Implementation Plan


### Overview

The feature has four layers:

| Layer | What it does |
|-------|-------------|
| Facebook Ads connection | OAuth with marketing scopes, stores access token + ad account ID |
| Campaign creation form | Multi-step form collecting business context |
| AI generation | Claude generates campaign objective, targeting, and ad copy |
| Facebook deployment | Marketing API creates Campaign → AdSet → Ad |

**Credit cost:** 10 credits per campaign generation.

---

### Data Model Changes (`prisma/schema.prisma`)

**Add to `User` model:**
```prisma
fbAccessToken   String?   // Facebook Ads user access token
fbAdAccountId   String?   // e.g. "act_123456789"
```

**New models:**
```prisma
model Campaign {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  status         CampaignStatus @default(DRAFT)
  objective      String        // OUTCOME_TRAFFIC, OUTCOME_LEADS, OUTCOME_SALES

  // Business context (from creation form)
  businessName   String
  businessType   String
  productService String
  targetAudience String
  uniqueValue    String
  dailyBudget    Float         // USD

  // Facebook IDs (set after deployment)
  fbCampaignId   String?
  fbAdSetId      String?
  fbAdId         String?

  // AI-generated content (stored as JSON)
  generatedContent Json?       // { headline, primaryText, description, cta, targeting }

  adSets         AdSet[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
  @@map("campaign")
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  ERROR
}

model AdSet {
  id           String   @id @default(cuid())
  campaignId   String
  campaign     Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  fbAdSetId    String?
  targeting    Json
  ads          Ad[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("ad_set")
}

model Ad {
  id           String   @id @default(cuid())
  adSetId      String
  adSet        AdSet    @relation(fields: [adSetId], references: [id], onDelete: Cascade)
  fbAdId       String?
  headline     String
  primaryText  String
  description  String?
  callToAction String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("ad")
}
```

Run `npm run db:push` after schema changes.

---

### Environment Variables

Add to `.env` / `.env.example`:
```
ANTHROPIC_API_KEY=""
```

The `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` already exist for auth. The same app will be used for the marketing OAuth, but with extended permissions (see below).

---

### Step 1 — Facebook Ads Connection

**Why a separate step?** The existing Facebook login uses basic scopes (public_profile, email). The Marketing API requires additional permissions: `ads_management`, `ads_read`, `business_management`. Users must explicitly grant these.

**Flow:**
1. User visits `/dashboard/campaigns` with no FB connection → sees "Connect Facebook Ads" CTA
2. Clicking it redirects to Facebook OAuth with marketing scopes
3. Facebook redirects back to `/api/facebook/callback` with an auth code
4. Server exchanges code for a long-lived access token, fetches available ad accounts, stores `fbAccessToken` + `fbAdAccountId` on the user

**Files:**
- `app/api/facebook/connect/route.ts` — GET: builds Facebook OAuth URL with marketing scopes, redirects
- `app/api/facebook/callback/route.ts` — GET: handles OAuth callback, exchanges code, fetches ad accounts, saves to DB
- `app/dashboard/campaigns/connect/page.tsx` — shown when user has multiple ad accounts to choose from (ad account selector)

**Note on scopes:** The Facebook app in the developer portal must have the `ads_management` permission approved. For development, test users can be granted it directly without full review.

---

### Step 2 — Campaign Creation Form

A client-side multi-step form at `/dashboard/campaigns/new/page.tsx`.

**Fields (all required for AI generation):**

| Field | Label | Type |
|-------|-------|------|
| `businessName` | Business name | text |
| `businessType` | Type of business | select (E-commerce, Service, App, Other) |
| `productService` | What are you selling? | textarea |
| `targetAudience` | Who is your ideal customer? | textarea |
| `uniqueValue` | What makes you different? | textarea |
| `objective` | Campaign goal | select (Traffic, Leads, Sales) |
| `dailyBudget` | Daily budget (USD) | number (min $5) |

This is a single page with all fields (not complex enough to need a multi-step wizard for MVP). Uses `shadcn/ui` `Form` + `Input`/`Textarea`/`Select`.

On submit: `POST /api/campaigns/generate`

---

### Step 3 — AI Generation API Route

**`app/api/campaigns/generate/route.ts`** — POST (authenticated)

1. Validate session → 401 if not authenticated
2. Check `user.credits >= 10` → 402 if insufficient
3. Call Claude (`claude-haiku-4-5-20251001` for cost efficiency) with a structured prompt containing the business context
4. Parse the structured JSON response (headline, primaryText, description, cta, targeting interests)
5. Deduct 10 credits: `prisma.user.update({ data: { credits: { decrement: 10 } } })`
6. Create `Campaign` record in DB with `status: DRAFT` and `generatedContent` set
7. Call Facebook Marketing API (Step 4 below)
8. Update `Campaign` with FB IDs, set `status: ACTIVE`
9. Return the campaign ID → client redirects to `/dashboard/campaigns/[id]`

**Claude prompt structure:**
```
You are a Facebook advertising expert. Generate a complete Facebook ad campaign for this business.

Business: {businessName}
Type: {businessType}
Product/Service: {productService}
Target audience: {targetAudience}
Unique value: {uniqueValue}
Objective: {objective}
Daily budget: ${dailyBudget}

Respond in JSON with this exact structure:
{
  "campaignName": string,
  "objective": "OUTCOME_TRAFFIC" | "OUTCOME_LEADS" | "OUTCOME_SALES",
  "targeting": {
    "ageMin": number,
    "ageMax": number,
    "genders": [1, 2] | [1] | [2],
    "interests": [{ "id": string, "name": string }]
  },
  "ad": {
    "headline": string (max 40 chars),
    "primaryText": string (max 125 chars),
    "description": string (max 30 chars),
    "callToAction": "LEARN_MORE" | "SHOP_NOW" | "SIGN_UP" | "GET_QUOTE" | "BOOK_TRAVEL"
  }
}
```

**Note on Facebook interest IDs:** Claude will generate plausible interest names/IDs, but for real deployment these must be validated against the Facebook Targeting Search API. For MVP, use the interest names only and skip ID-based targeting, using broad audience + demographics instead.

---

### Step 4 — Facebook Marketing API Deployment

Handled within `app/api/campaigns/generate/route.ts` after AI generation.

**Deployment sequence** (using user's `fbAccessToken` and `fbAdAccountId`):

1. **Create Campaign** — `POST /{adAccountId}/campaigns`
   ```json
   { "name": campaignName, "objective": objective, "status": "ACTIVE", "special_ad_categories": [] }
   ```
   → Stores `fbCampaignId`

2. **Create Ad Set** — `POST /{adAccountId}/adsets`
   ```json
   {
     "name": "{campaignName} - Ad Set 1",
     "campaign_id": fbCampaignId,
     "daily_budget": dailyBudget * 100,  // convert to cents
     "billing_event": "IMPRESSIONS",
     "optimization_goal": "REACH",
     "targeting": { "age_min": 18, "age_max": 65, "genders": [1,2] },
     "status": "ACTIVE"
   }
   ```
   → Stores `fbAdSetId`

3. **Create Ad Creative** — `POST /{adAccountId}/adcreatives`
   ```json
   {
     "name": "{campaignName} - Creative",
     "object_story_spec": {
       "page_id": fbPageId,
       "link_data": {
         "message": primaryText,
         "name": headline,
         "description": description,
         "call_to_action": { "type": callToAction, "value": { "link": campaignUrl } }
       }
     }
   }
   ```

4. **Create Ad** — `POST /{adAccountId}/ads`
   ```json
   { "name": "{campaignName} - Ad 1", "adset_id": fbAdSetId, "creative": { "creative_id": creativeId }, "status": "ACTIVE" }
   ```
   → Stores `fbAdId`

**Facebook SDK:** Use the raw `fetch` API against `https://graph.facebook.com/v21.0` — no FB SDK needed, keeps dependencies lean.

**Error handling:** If any Facebook API call fails, set campaign `status: ERROR`, store the error message in `generatedContent.error`, and refund the 10 credits.

---

### Step 5 — Campaigns Dashboard

**`app/dashboard/campaigns/page.tsx`** — Server component

- Checks FB connection — shows "Connect Facebook Ads" banner if missing
- Fetches user's campaigns from DB
- Lists campaigns as cards showing: name, status badge, objective, daily budget, creation date
- "Create campaign" button → `/dashboard/campaigns/new`

**`app/dashboard/campaigns/[id]/page.tsx`** — Server component

- Shows campaign details: AI-generated copy, targeting, Facebook IDs
- Status badge (DRAFT / ACTIVE / PAUSED / ERROR)
- Link to view in Facebook Ads Manager

---

### File Summary

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add Campaign, AdSet, Ad models + User.fbAccessToken/fbAdAccountId |
| `lib/facebook.ts` | Facebook Graph API helper (typed fetch wrapper) |
| `lib/anthropic.ts` | Anthropic client singleton |
| `app/api/facebook/connect/route.ts` | Starts Facebook marketing OAuth flow |
| `app/api/facebook/callback/route.ts` | Handles OAuth callback, saves token |
| `app/api/campaigns/generate/route.ts` | AI generation + Facebook deployment |
| `app/dashboard/campaigns/page.tsx` | Campaign list |
| `app/dashboard/campaigns/new/page.tsx` | Campaign creation form |
| `app/dashboard/campaigns/[id]/page.tsx` | Campaign detail view |

---

## Task Breakdown

- [ ] Update Prisma schema (Campaign, AdSet, Ad models; User.fbAccessToken/fbAdAccountId); run `db:push` + `db:generate`
- [ ] Add `ANTHROPIC_API_KEY` to `.env` and `.env.example`
- [ ] Build `lib/facebook.ts` — typed helper for Graph API calls (auth, campaigns, adsets, ads, creatives)
- [ ] Build `lib/anthropic.ts` — Anthropic client singleton
- [ ] Build `app/api/facebook/connect/route.ts` + `app/api/facebook/callback/route.ts` — marketing OAuth flow
- [ ] Build `app/api/campaigns/generate/route.ts` — AI generation + credit deduction + Facebook deployment
- [ ] Build `app/dashboard/campaigns/page.tsx` — campaign list with FB connection check
- [ ] Build `app/dashboard/campaigns/new/page.tsx` — campaign creation form
- [ ] Build `app/dashboard/campaigns/[id]/page.tsx` — campaign detail view
