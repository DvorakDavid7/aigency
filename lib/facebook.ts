import { headers } from "next/headers"
import { auth } from "./auth"

const FB_API_VERSION = "v21.0"
const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`

export type AdAccount = {
  id: string             // format: "act_XXXXXXXXX"
  name: string
  account_status: number // 1 = active
}

// ─── Token retrieval ──────────────────────────────────────────────────────────

// Get the Facebook Ads access token for a user via Better Auth.
// Better Auth handles storage and refresh automatically.
export async function getFbAccessToken(userId: string): Promise<string> {
  const result = await auth.api.getAccessToken({
    body: { providerId: "facebook-ads", userId },
    headers: await headers(),
  })
  if (!result?.accessToken) {
    throw new Error("No Facebook Ads token found for user. Please reconnect your account.")
  }
  return result.accessToken
}

// ─── Ad Account management ────────────────────────────────────────────────────

export async function getAdAccounts(accessToken: string): Promise<AdAccount[]> {
  const res = await fetch(
    `${FB_BASE}/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to fetch ad accounts: ${err.error?.message}`)
  }
  const data = await res.json()
  return data.data ?? []
}

// ─── Campaign management ──────────────────────────────────────────────────────

export async function createCampaign(
  accountId: string,
  accessToken: string,
  params: { name: string; objective: string; status: string }
) {
  const res = await fetch(`${FB_BASE}/${accountId}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, access_token: accessToken }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to create campaign: ${err.error?.message}`)
  }
  return res.json()
}

export async function createAdSet(
  accountId: string,
  accessToken: string,
  params: object
) {
  const res = await fetch(`${FB_BASE}/${accountId}/adsets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, access_token: accessToken }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to create ad set: ${err.error?.message}`)
  }
  return res.json()
}

export async function createAd(
  accountId: string,
  accessToken: string,
  params: object
) {
  const res = await fetch(`${FB_BASE}/${accountId}/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, access_token: accessToken }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to create ad: ${err.error?.message}`)
  }
  return res.json()
}

export async function pauseCampaign(campaignId: string, accessToken: string) {
  const res = await fetch(`${FB_BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PAUSED", access_token: accessToken }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to pause campaign: ${err.error?.message}`)
  }
  return res.json()
}

export async function updateAdSetBudget(
  adSetId: string,
  accessToken: string,
  dailyBudget: number // in cents
) {
  const res = await fetch(`${FB_BASE}/${adSetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ daily_budget: dailyBudget, access_token: accessToken }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to update ad set budget: ${err.error?.message}`)
  }
  return res.json()
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function getCampaignInsights(
  campaignId: string,
  accessToken: string,
  dateRange: { since: string; until: string } // YYYY-MM-DD
) {
  const fields = "spend,impressions,reach,clicks,ctr,actions,cost_per_action_type,purchase_roas"
  const params = new URLSearchParams({
    fields,
    time_range: JSON.stringify(dateRange),
    access_token: accessToken,
  })
  const res = await fetch(`${FB_BASE}/${campaignId}/insights?${params}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Failed to fetch campaign insights: ${err.error?.message}`)
  }
  return res.json()
}
