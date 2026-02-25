import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { FacebookAdsApi, AdAccount, Campaign } from "facebook-nodejs-business-sdk"

const AD_ACCOUNT_ID = "act_1393071921792663"
const PAGE_ID = "700607016477431"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "facebook" },
    select: { accessToken: true },
  })

  if (!account?.accessToken) {
    return NextResponse.json({ error: "No Facebook account connected" }, { status: 400 })
  }

  FacebookAdsApi.init(account.accessToken)

  const adAccount = new AdAccount(AD_ACCOUNT_ID)
  let campaignId = ""

  try {
    // 1. Create campaign
    const campaign = await adAccount.createCampaign(["id"], {
      name: "Integration Test Campaign",
      objective: "OUTCOME_SALES",
      status: Campaign.Status.paused,
      buying_type: "AUCTION",
      special_ad_categories: [],
    })
    campaignId = campaign.id
    console.log("Campaign created:", campaignId)

    // 2. Create ad set
    const adSet = await adAccount.createAdSet(["id"], {
      name: "Integration Test AdSet",
      campaign_id: campaignId,
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      daily_budget: 10000, // 100 CZK in cents
      targeting: {
        geo_locations: { countries: ["CZ"] },
        age_min: 18,
        age_max: 65,
      },
      status: "PAUSED",
    })
    console.log("AdSet created:", adSet.id)

    // 3. Create ad creative using an image URL (no upload needed for test)
    const adCreative = await adAccount.createAdCreative(["id"], {
      name: "Integration Test Creative",
      object_story_spec: {
        page_id: PAGE_ID,
        link_data: {
          message: "Check out our new website!",
          link: "https://aigency.app",
          image_url: "https://placehold.co/1200x628/png",
          call_to_action: { type: "LEARN_MORE" },
        },
      },
    })
    console.log("AdCreative created:", adCreative.id)

    // 4. Create ad
    const ad = await adAccount.createAd(["id"], {
      name: "Integration Test Ad",
      adset_id: adSet.id,
      status: "PAUSED",
      creative: { creative_id: adCreative.id },
    })
    console.log("Ad created:", ad.id)

    // 5. Clean up — delete campaign (cascades to ad set + ad)
    await campaign.delete()
    console.log("Campaign deleted")

    return NextResponse.json({
      success: true,
      created: {
        campaignId,
        adSetId: adSet.id,
        adCreativeId: adCreative.id,
        adId: ad.id,
      },
    })
  } catch (err: any) {
    // Clean up on failure
    if (campaignId) {
      try {
        const c = new Campaign(campaignId)
        await c.delete()
      } catch {}
    }
    console.error("Facebook API error:", err)
    return NextResponse.json({ error: err.message ?? "Facebook API error", details: err }, { status: 500 })
  }
}
