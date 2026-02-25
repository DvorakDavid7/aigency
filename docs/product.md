# Aigency — Your AI Marketing Agency

## 1. What It Is

Aigency is an autonomous AI marketing agent that runs Facebook ad campaigns on behalf of business owners. The user describes their business, sets a budget, and Aigency handles everything else — strategy, creative, targeting, deployment, and continuous optimization.

There is no marketing knowledge required. No dashboards to learn. No campaign settings to configure. The user talks to the AI, approves key decisions, and watches results come in.

**The core promise:** agency-level Facebook advertising results, without hiring an agency.

---

## 2. Primary Target Customer — Phase 1

**The business owner who just wants results.**

- Solo founders and small business owners
- E-commerce brands with a product to sell
- Service businesses looking for leads (dentists, lawyers, coaches, gyms, etc.)
- Startups that need customer acquisition but have no marketing team
- Businesses currently paying a marketing agency and unsatisfied with results
- Businesses that tried running Facebook ads themselves and gave up

**Their profile:**
- No knowledge of Facebook Ads Manager, campaign structure, or PPC optimization
- Has a budget to spend on ads but doesn't know how to spend it effectively
- Wants to promote their product or service but doesn't know where to start
- Values results over control — they don't want to manage campaigns, they want customers
- Frustrated by the complexity and cost of traditional agencies

**What they want to say:** *"Here's my business, here's my budget, get me customers."*

---

## 3. How It Works

### 3.1 Onboarding via Chat

The user has a natural conversation with the AI agent. The agent asks the right questions to understand the business:

- What does the business do?
- Who is the ideal customer?
- What is the product or service and what does it cost?
- What makes it different from competitors?
- What is the goal — leads, sales, website traffic, app installs?
- What is the monthly ad budget?
- Where are the customers located?

No forms. No jargon. Just a conversation. The agent builds a structured campaign brief from the answers.

### 3.2 Facebook Account Connection

When ready to launch, the agent prompts the user to connect their Facebook Business account via OAuth. One-time setup. The agent explains why it needs access and what it will do with it.

### 3.3 Campaign Generation and Approval

The agent presents a campaign plan in plain language:

- What type of campaign it will run and why
- Who it will target and why
- What the ads will say
- How the budget will be allocated
- What results to expect in the first 2 weeks

The user approves with one click or asks the agent to adjust anything. The agent then deploys the campaign to Facebook automatically.

### 3.4 Autonomous Management

Once live, the agent manages the campaign continuously:

- Monitors performance metrics every few hours
- Pauses underperforming ads automatically
- Reallocates budget to what is working
- Rotates creatives before fatigue sets in
- Scales spend when ROAS thresholds are met
- Runs A/B tests and declares winners

The user is never burdened with these decisions. The agent handles them and posts a plain-language update to the chat when something significant happens.

### 3.5 User Approvals

For high-stakes actions the agent asks before acting:

- Increasing the budget significantly
- Launching a new campaign
- Changing the core audience targeting
- Pausing the entire campaign

For routine optimizations (pausing a single underperforming ad, reallocating small budget amounts) the agent acts autonomously and reports back.

### 3.6 Results Reporting

The user sees a simple performance summary:

- How much has been spent
- How many people were reached
- How many leads or sales were generated
- Cost per lead or cost per acquisition
- Week-over-week trend

No campaign jargon. No ad set breakdowns. Just the numbers that matter to a business owner.

---

## 4. The User Experience

The entire product is driven through a chat interface. There is no complex dashboard. The user opens their project and sees a conversation with their AI marketing agent — past decisions, current campaign status, recent optimizations, and upcoming recommendations.

The UI has three elements:

1. **Chat** — the primary interface. All interaction happens here.
2. **Artifacts panel** — generated assets the user can reference (campaign brief, ad copy, performance summaries, creatives).
3. **Activity feed** — a log of what the agent has done autonomously so the user always knows what is happening.

This is intentionally simple. The complexity lives inside the AI, not in the UI.

### 4.1 Multiple Conversations per Project

Each project contains multiple conversations, organised by purpose. The user rarely creates them manually — most are opened automatically by the agent when a new campaign launches or a significant event occurs.

Three types of conversations exist within a project:

- **Onboarding** — one per project, happens once, archived after setup. Captures the business brief.
- **Campaign threads** — one per campaign. All decisions, approvals, optimizations, and updates for that campaign live here. Closed when the campaign ends but remains searchable.
- **Agent-initiated threads** — opened automatically by the background agent for weekly performance reports, budget alerts, scaling opportunities, or any significant event requiring attention.

The left panel organises conversations by status:

```
ACTIVE
  Campaign: Summer Sale
  Campaign: Retargeting

AGENT UPDATES
  Weekly Report        ← unread badge
  Budget Alert

COMPLETED
  Onboarding
  Spring Campaign
```

This keeps each thread focused, makes history searchable, and mirrors how a real agency communicates — separate threads per campaign, not one endless chain.

### 4.2 Project Brief and Scope Changes

The agent builds a structured brief during onboarding capturing everything it needs to manage campaigns: business description, product, target audience, goal, budget, location, and unique selling point. This brief is the source of truth the AI reads before generating or optimising anything.

Users can update the brief in two ways:

- **Via chat** — the natural approach. The user tells the agent *"Actually, I want to focus on restaurants, not retail"* and the agent updates the brief and adjusts strategy accordingly.
- **Brief card in the Artifacts panel** — a structured view of what the agent currently knows about the business. Readable at a glance, with a direct edit option for precise corrections.

This ensures the user always knows exactly what context the AI is working from, and can correct it at any time without re-doing the full onboarding conversation.

---

## 5. Natural Expansion — Phase 2: The Professional Workbench

Once the AI engine is proven to deliver results, the same engine can be exposed to a second type of user: **professional marketers and agencies**.

**Their profile:**
- Freelance media buyers and performance marketers
- Digital marketing agencies managing multiple clients
- In-house marketing teams at mid-size companies
- Businesses that understand Facebook Ads but want AI-assisted optimization

**What they need beyond Phase 1:**
- Full visibility into campaign structure — ad sets, audiences, creatives, bidding
- Ability to override AI decisions and set their own rules
- Multi-client project management
- Detailed performance analytics with breakdowns
- White-label capability to present results to their own clients

**How the expansion works:**

The AI engine underneath does not change. The same autonomous optimization logic runs. But a professional UI layer is added on top that exposes the internals — campaign tables, targeting details, creative performance grids, manual override controls.

For agencies this becomes a force multiplier: the AI handles the routine optimization work across all their clients simultaneously while the human marketer focuses on strategy and client relationships.

---

## 6. Core Technical Components

1. **Onboarding conversation engine** — structured chat flow that extracts business context and builds a campaign brief
2. **Facebook OAuth integration** — connects user's Facebook Business account
3. **AI campaign generation** — takes the brief, generates full campaign structure using Claude
4. **Facebook Marketing API layer** — deploys and manages campaigns programmatically
5. **Performance data collector** — pulls metrics from Facebook API on a schedule
6. **Optimization engine** — rule-based + AI logic that takes autonomous actions
7. **Notification and approval system** — routes high-stakes decisions to the user, executes routine ones automatically
8. **Artifact storage** — saves generated briefs, ad copy, creatives, and reports for reference

---

## 7. Revenue Model

**Phase 1 — Subscription tiers based on ad spend managed:**

- Starter — up to $2,000/month ad spend
- Growth — up to $10,000/month ad spend
- Scale — up to $50,000/month ad spend
- Enterprise — unlimited, custom pricing

The platform fee is a monthly subscription. The ad spend goes directly to Facebook — Aigency never touches the client's ad budget.

**Phase 2 — Agency tier:**

Per-seat pricing for professional marketers managing multiple client accounts. Higher price point, multi-client dashboard, white-label reporting.

---

## 8. Success Metric

The single most important metric: **does the AI deliver better ROAS than the user would achieve on their own or with a typical agency?**

Everything else is secondary. The product only works if the AI actually delivers results. Phase 1 exists to prove this with real campaigns before scaling to a broader user base.
