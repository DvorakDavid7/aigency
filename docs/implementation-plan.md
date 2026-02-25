# Aigency — Implementation Plan

## Overview

Build the autonomous AI marketing agency in phases. Each phase is independently shippable and builds on the previous. The goal of Phase 1–7 is to prove the engine works: a user describes their business, the AI deploys and optimises Facebook campaigns, and delivers measurable ROAS.

---

## Phase 1 — Data Model

Everything downstream depends on the schema being right. Do this first.

### New models

**ProjectBrief**
Stores the structured context the AI extracts from onboarding. One per project.
```
id
projectId          (unique, FK → Project)
businessDescription
product
targetAudience
goal               (LEADS | SALES | TRAFFIC | APP_INSTALLS)
monthlyBudget      (Int, in cents)
location           (String)
uniqueSellingPoint
websiteUrl
createdAt
updatedAt
```

**FacebookConnection**
Stores the FB OAuth token per user. One per user (not per project — one FB account manages all).
```
id
userId             (unique, FK → User)
fbUserId
fbAccountId        (the Ad Account ID used for campaigns)
accessToken        (encrypted)
tokenExpiresAt
createdAt
updatedAt
```

**Conversation — add type field**
Extend the existing Conversation model:
```
type    ConversationType   (ONBOARDING | CAMPAIGN | AGENT)
status  ConversationStatus (ACTIVE | COMPLETED | ARCHIVED)
```

**Message — add type field**
Extend the existing Message model:
```
type      MessageType  (TEXT | APPROVAL_REQUEST | APPROVAL_RESPONSE | AGENT_ACTION | FB_CONNECT)
metadata  Json?        (structured payload for non-text messages)
```

**Artifact**
Stores extracted outputs from conversations.
```
id
projectId
conversationId  (FK → Conversation, nullable)
type            ArtifactType (BRIEF | AD_COPY | CAMPAIGN | IMAGE | REPORT | ACTION)
title
content         Json
createdAt
updatedAt
```

**CampaignRecord**
Tracks deployed Facebook campaigns. Links our DB to FB's IDs.
```
id
projectId
conversationId
fbCampaignId
fbAdSetIds      Json   (array)
fbAdIds         Json   (array)
status          CampaignStatus (DRAFT | PENDING_APPROVAL | ACTIVE | PAUSED | COMPLETED)
structure       Json   (the full approved campaign structure)
createdAt
updatedAt
```

**PerformanceSnapshot**
Stores pulled metrics per campaign per day.
```
id
campaignRecordId
date
spend            (Int, cents)
impressions
reach
clicks
ctr              (Float)
conversions
costPerConversion (Int, cents)
roas             (Float)
createdAt
```

**Notification**
```
id
userId
projectId        (nullable)
conversationId   (nullable)
type             NotificationType (APPROVAL_NEEDED | AGENT_UPDATE | ALERT | REPORT)
title
body
read             (Boolean, default false)
createdAt
```

### Changes to existing models
- `Project` — add `brief` relation to `ProjectBrief`
- `Conversation` — add `type`, `status`, `campaignRecordId` (nullable)
- `Message` — add `type`, `metadata`
- `User` — add `facebookConnection` relation

### Commands after schema changes
```bash
npm run db:migrate   # create migration file
npm run db:generate  # regenerate Prisma client
```

---

## Phase 2 — Facebook OAuth Connection

### Goal
User connects their Facebook Business account from within the chat. No separate settings page.

### How it works
1. When a project has no `FacebookConnection`, the onboarding agent includes a special message in chat with `type: FB_CONNECT`
2. The chat renders this message as an inline connection card with a "Connect Facebook" button
3. Button triggers FB OAuth flow via a Next.js API route
4. On callback, token is saved to `FacebookConnection`, user is redirected back to chat
5. Agent detects the connection and continues onboarding

### API routes needed
- `GET /api/auth/facebook` — initiates OAuth, redirects to FB
- `GET /api/auth/facebook/callback` — receives code, exchanges for token, saves to DB, redirects to `/chat/[projectId]`

### FB OAuth scopes required
```
ads_management
ads_read
business_management
pages_read_engagement
```

### Components
- `FbConnectCard` — special message bubble rendered when `message.type === FB_CONNECT`. Shows FB logo, explanation text, "Connect Facebook" button. Replaced with a success state once connected.

### Key notes
- Store access token encrypted at rest (use `crypto` from Node, AES-256)
- FB long-lived tokens last 60 days — store `tokenExpiresAt`, refresh proactively
- The `fbAccountId` (Ad Account) must be captured during OAuth or in a follow-up step — the user may manage multiple ad accounts, so prompt them to select one

---

## Phase 3 — Onboarding Conversation

### Goal
When a user creates a project and opens chat for the first time, the agent guides them through a structured conversation to build the project brief. At the end, the brief is saved as a `ProjectBrief` and an `Artifact` of type `BRIEF`.

### How it works
1. `app/chat/[projectId]/page.tsx` checks if a `ProjectBrief` exists for the project
2. If not, it creates an `ONBOARDING` conversation automatically (or on first message)
3. The onboarding conversation has a system prompt that instructs the AI to ask specific questions in a natural way and extract structured data
4. Each user message is sent to `POST /api/chat/message` which calls Claude with the full conversation history + system prompt
5. When the AI determines it has enough information, it emits a structured JSON block in its response (hidden from the user)
6. The API route parses this, saves the `ProjectBrief`, saves an `Artifact`, marks the conversation as `COMPLETED`

### API routes needed
- `POST /api/chat/message` — receives `{ conversationId, content }`, appends user message, calls Claude, streams response back, saves assistant message

### System prompt for onboarding
The system prompt instructs Claude to:
- Ask questions conversationally, one or two at a time
- Not use marketing jargon
- When it has all required fields, emit `<brief>{ ...json }</brief>` at the end of a message
- Confirm with the user before finalising

### Components
- `ChatMain` — wire up to real API, implement streaming response rendering
- `OnboardingCompleteCard` — shown when brief is saved, with summary of what the agent understood and a "Looks good, let's launch" button

### Key notes
- Streaming is important for UX — use `ReadableStream` / Vercel AI SDK
- The onboarding conversation is archived after completion but stays searchable
- If the user wants to change the brief later, they can say so in any conversation — the agent updates `ProjectBrief` and confirms

---

## Phase 4 — AI Campaign Generation and Approval

### Goal
After onboarding (and FB connected), the agent generates a complete campaign structure and presents it for user approval in a structured card before touching the Facebook API.

### How it works
1. Agent reads `ProjectBrief` and calls Claude with a campaign generation prompt
2. Claude returns a structured campaign plan (JSON) wrapped in plain-language explanation
3. The API saves this as a `CampaignRecord` with status `PENDING_APPROVAL` and an `Artifact` of type `CAMPAIGN`
4. A message of type `APPROVAL_REQUEST` is saved, which renders as a campaign approval card in the chat
5. User clicks "Approve" or "Request changes"
6. Approve → status becomes `ACTIVE`, triggers Phase 5
7. Request changes → user types adjustments, agent regenerates

### Campaign structure shape
```json
{
  "objective": "LEAD_GENERATION",
  "name": "Summer Sale — Leads",
  "dailyBudget": 5000,
  "adSets": [{
    "name": "Interest — Fitness 25-45",
    "targeting": { "ageMin": 25, "ageMax": 45, "interests": [...] },
    "ads": [{
      "name": "Ad 1 — Pain point headline",
      "headline": "...",
      "primaryText": "...",
      "cta": "LEARN_MORE",
      "imagePrompt": "..."
    }]
  }]
}
```

### Components
- `CampaignApprovalCard` — rendered for `APPROVAL_REQUEST` messages. Shows campaign objective, targeting summary, ad copy preview, budget breakdown, projected results. Approve / Request changes buttons.
- `POST /api/chat/approve` — receives `{ campaignRecordId }`, updates status, triggers deployment

### Key notes
- Never deploy to Facebook without explicit user approval
- Show projected results honestly — set expectations, not hype
- The approval card must be clear enough that a non-marketer understands what they're approving

---

## Phase 5 — Facebook API Deployment

### Goal
Take the approved `CampaignRecord` and create the actual campaign on Facebook via the Marketing API.

### Deployment sequence
1. Create Campaign object → save `fbCampaignId`
2. Create Ad Set(s) → save `fbAdSetIds`
3. Generate or upload creative images (placeholder or AI-generated)
4. Create Ads → save `fbAdIds`
5. Update `CampaignRecord` status to `ACTIVE`
6. Post a confirmation message to the campaign conversation

### FB API calls
```
POST /{ad-account-id}/campaigns
POST /{ad-account-id}/adsets
POST /{ad-account-id}/adimages   (upload creative)
POST /{ad-account-id}/ads
```

### API routes needed
- `POST /api/campaigns/deploy` — called after approval, runs the deployment sequence, handles errors gracefully

### New file
`lib/facebook.ts` — wrapper around the FB Marketing API. Functions:
- `createCampaign(accountId, token, structure)`
- `createAdSet(accountId, token, campaignId, adSet)`
- `createAd(accountId, token, adSetId, ad)`
- `getCampaignInsights(accountId, token, campaignId, dateRange)`
- `pauseCampaign(accountId, token, campaignId)`
- `updateAdSetBudget(accountId, token, adSetId, newBudget)`

### Key notes
- Deployment can fail partway through — track which steps completed so you can resume or clean up
- FB API has rate limits — handle 429s with exponential backoff
- Images must meet FB spec (1200x628px minimum, <30% text)
- Start with a single ad set, single ad per campaign to keep deployment simple

---

## Phase 6 — Performance Monitoring

### Goal
Pull campaign metrics from Facebook on a schedule, store them, and have the agent post updates to the campaign conversation when something significant happens.

### Cron job
Use Vercel Cron (defined in `vercel.json`).
```json
{
  "crons": [{
    "path": "/api/cron/monitor",
    "schedule": "0 */4 * * *"
  }]
}
```

### `GET /api/cron/monitor`
1. Fetch all `CampaignRecord` rows with status `ACTIVE`
2. For each, call `getCampaignInsights()` from `lib/facebook.ts`
3. Save a new `PerformanceSnapshot` row
4. Compare to previous snapshot — detect significant changes
5. If significant: call the agent to write a message to the campaign conversation

### Significant events that trigger a message
- ROAS drops below threshold (< 1.5x)
- CTR drops below threshold (< 0.5%)
- Daily budget 80% spent by midday
- A single ad is dramatically outperforming others (> 2x average CTR)
- Campaign has been running 7 days — trigger weekly report

### Key notes
- Protect the cron endpoint with a secret header (`CRON_SECRET` env var)
- Keep the cron job fast — fan out heavy work to background tasks if needed
- Store raw FB API response in `PerformanceSnapshot` for debugging

---

## Phase 7 — Optimization Engine

### Goal
Based on performance data, the agent takes autonomous actions for routine decisions and seeks approval for high-stakes ones.

### Autonomous actions (no approval needed)
- Pause an ad with CTR < 0.3% after 1,000 impressions
- Reallocate up to 20% of budget from underperforming to outperforming ad set
- Rotate creative when frequency > 3 (same person seeing the ad 3+ times)

### Approval required
- Pause entire campaign
- Increase total budget by more than 30%
- Launch a new campaign
- Change core audience targeting

### How it works
1. After `PerformanceSnapshot` is saved, the optimization engine runs
2. It applies rules to determine what actions to take
3. Autonomous actions: execute immediately via FB API, log as `Artifact` of type `ACTION`, post a plain-language summary message to conversation
4. Approval actions: create `APPROVAL_REQUEST` message with action card, create `Notification`

### New file
`lib/optimization.ts` — the rule engine.
```
evaluatePerformance(snapshot, previousSnapshot, campaignRecord)
  → { autonomousActions[], approvalActions[] }
```

### Components
- `ActionApprovalCard` — rendered for optimization approval requests. Shows what the agent wants to do, why, and projected impact. Approve / Dismiss buttons.
- `ActionSummaryMessage` — rendered for completed autonomous actions. Shows what was done and the outcome.

---

## Phase 8 — Right Panel: Artifacts, Activity, Tools

### Goal
Replace the current static tools list with a functional three-tab right panel.

### Tabs

**Tools tab**
- Lists available agent capabilities
- Clicking a tool injects a pre-written prompt into the chat input
- Tools that are currently executing show a spinner

**Artifacts tab**
- Lists all `Artifact` rows for the current project, newest first
- Grouped by type: Brief, Campaigns, Ad Copy, Reports, Actions
- Clicking an artifact opens a preview modal
- Artifacts can be downloaded (ad copy as text, reports as PDF)

**Activity tab**
- Lists all autonomous actions the agent has taken (Artifact type `ACTION`)
- Shows what was done, when, and outcome
- Timeline grouped by day

### API routes needed
- `GET /api/projects/[projectId]/artifacts` — returns artifacts for right panel
- `GET /api/projects/[projectId]/activity` — returns action log

### Components
- `RightPanelTabs` — replaces current `ChatRightPanel`, three tabs
- `ArtifactList` — renders artifacts grouped by type
- `ArtifactPreview` — modal to view full artifact content
- `ActivityTimeline` — renders action log

---

## Phase 9 — Notifications

### Goal
The bell icon in the header (already exists in `app/dashboard/layout.tsx`) shows unread notification count and links to relevant conversations.

### When notifications are created
- Agent posts an approval request → notification
- Agent posts a significant update → notification
- Campaign goes live → notification
- Weekly report ready → notification
- Budget running low → notification

### API routes needed
- `GET /api/notifications` — returns unread notifications for current user
- `POST /api/notifications/[id]/read` — marks as read

### Components
- `NotificationBell` — replaces current static Bell icon in dashboard header. Shows unread badge. Clicking opens a dropdown list of recent notifications. Each notification links to its conversation.

### Key notes
- Poll for new notifications every 60 seconds (simple) or use Server-Sent Events (better)
- Future: push notifications via web push API

---

## Phase 10 — Results Reporting

### Goal
A simple performance summary the user can understand without any marketing knowledge. Lives as a generated `Artifact` of type `REPORT`, also surfaced in chat as a weekly message.

### What is shown
- Total spend to date
- Total people reached
- Total leads or sales generated
- Cost per lead / cost per acquisition
- ROAS
- Week-over-week trend (up/down %)
- Plain-language summary written by the agent

### How it works
1. Weekly cron generates a report by aggregating `PerformanceSnapshot` rows
2. Claude writes a plain-language summary from the numbers
3. Saved as `Artifact` type `REPORT`
4. Posted as a message in the campaign conversation
5. Notification created for the user

### Components
- `ReportCard` — rendered in chat for report messages. Shows key metrics in a clean card with trend indicators. Links to full artifact.

---

## Implementation Order

```
Phase 1   Schema                      ← foundation, do first
Phase 2   Facebook OAuth              ← needed before anything FB-related
Phase 3   Onboarding conversation     ← first real AI interaction
Phase 4   Campaign generation         ← first output
Phase 5   Facebook deployment         ← first real campaign
Phase 6   Performance monitoring      ← first data
Phase 7   Optimization engine         ← first autonomous action
Phase 8   Right panel                 ← UI layer on top of working engine
Phase 9   Notifications               ← polish
Phase 10  Results reporting           ← polish
```

---

## Environment Variables Needed

```env
# Existing
DATABASE_URL
BETTER_AUTH_SECRET

# New
ANTHROPIC_API_KEY
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
FACEBOOK_REDIRECT_URI
CRON_SECRET
ENCRYPTION_KEY          # for encrypting FB tokens at rest
```

---

## Key Architectural Decisions

1. **Streaming AI responses** — use the Vercel AI SDK (`ai` package) for streaming Claude responses in chat. Avoids timeout issues on long generations.

2. **FB token encryption** — never store raw access tokens. Use AES-256 encryption with `ENCRYPTION_KEY` before writing to DB.

3. **Cron vs queue** — Vercel Cron for now (simple). If optimization actions become heavy, move to a job queue (Inngest or Trigger.dev) later.

4. **Conversation context window** — when calling Claude for campaign management, send the project brief + last 20 messages as context. Don't send entire conversation history to keep costs down.

5. **Approval as the safety layer** — any action that touches budget or audience targeting requires explicit user approval. This is non-negotiable.
