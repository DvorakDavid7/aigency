import 'dotenv/config'
import readline from "readline/promises"
import { generateText, stepCountIs } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { FacebookAdsApi, AdAccount, AdImage, Campaign, AdSet, AdCreative, Ad } from "facebook-nodejs-business-sdk"
import fs, { readFile } from "fs"
import path from "path"
import { z } from "zod"

const AD_ACCOUNT_ID = "act_1393071921792663"
const PAGE_ID = "700607016477431"

function initFacebook() {
  const api = FacebookAdsApi.init(process.env.FACEBOOK_API_TOKEN!)
  // api.setDebug(true)
}

// ── Tool ─────────────────────────────────────────────────────────────────────

function readFileTool() {
  return {
    description: "Read text content from a file",
    inputSchema: z.object({
      path: z.string().describe("File path to read"),
    }),
    execute: async ({ path }: { path: string }) => {
      return fs.readFileSync(path, "utf-8")
    },
  }
}

function deployFacebookCampaignTool() {
  return {
    description: "Deploy a complete Facebook ad campaign — creates campaign, ad set, creative, and ad in one shot.",
    inputSchema: z.object({
      adCopy: z.string().describe("Main ad body text"),
      imagePath: z.string().optional().describe("Local path to an image file to use in the ad (optional)"),
    }),
    execute: async ({ adCopy, imagePath }: { adCopy: string; imagePath?: string }) => {
      const account = new AdAccount(AD_ACCOUNT_ID)

      const campaign = await account.createCampaign([], {
        [Campaign.Fields.name]: "Test Campaign " + new Date().toISOString(),
        [Campaign.Fields.objective]: Campaign.Objective.outcome_traffic,
        [Campaign.Fields.status]: Campaign.Status.paused,
        [Campaign.Fields.special_ad_categories]: ["NONE"],
        "is_adset_budget_sharing_enabled": false,
      })
      console.log("  → Campaign:", campaign.id)

      const adSet = await account.createAdSet([], {
        [AdSet.Fields.name]: "Test Ad Set",
        [AdSet.Fields.campaign_id]: campaign.id,
        [AdSet.Fields.daily_budget]: 5000,
        [AdSet.Fields.billing_event]: AdSet.BillingEvent.impressions,
        [AdSet.Fields.optimization_goal]: AdSet.OptimizationGoal.link_clicks,
        [AdSet.Fields.bid_amount]: 200,
        [AdSet.Fields.status]: AdSet.Status.paused,
        [AdSet.Fields.targeting]: {
          geo_locations: { countries: ["US"] },
          age_min: 18,
          age_max: 65,
        },
      })
      console.log("  → Ad Set:", adSet.id)

      let imageHash: string | undefined
      if (imagePath) {
        const imageData = fs.readFileSync(path.resolve(imagePath)).toString("base64")
        const adImage = await account.createAdImage([], { bytes: imageData }) as any
        imageHash = Object.values(adImage.images as Record<string, { hash: string }>)[0].hash
        console.log("  → Image hash:", imageHash)
      }

      const creative = await account.createAdCreative([], {
        [AdCreative.Fields.name]: "Test Creative",
        [AdCreative.Fields.object_story_spec]: {
          page_id: PAGE_ID,
          link_data: {
            link: "https://autouchytil.cz",
            message: adCopy,
            ...(imageHash ? { image_hash: imageHash } : {}),
          },
        },
      })
      console.log("  → Creative:", creative.id)

      const ad = await account.createAd([], {
        [Ad.Fields.name]: "Test Ad",
        [Ad.Fields.adset_id]: adSet.id,
        [Ad.Fields.creative]: { creative_id: creative.id },
        [Ad.Fields.status]: Ad.Status.paused,
      })
      console.log("  → Ad:", ad.id)

      return { campaignId: campaign.id, adSetId: adSet.id, creativeId: creative.id, adId: ad.id }
    },
  }
}

// ── Agent ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI marketing agent that deploys Facebook ad campaigns for business owners.

Given a business description, use the deployFacebookCampaign tool to create a complete campaign. You decide:
- The right objective based on their goal
- Compelling ad copy that speaks to their audience
- Sensible targeting (age range, countries) based on their business
- A reasonable daily budget based on what they tell you

All campaigns are created paused — the user reviews before going live. Be decisive, do not ask for confirmation.`

function createFacebookAdAgent() {
  return {
    run(prompt: string) {
      return generateText({
        model: anthropic("claude-sonnet-4-6"),
        system: SYSTEM_PROMPT,
        prompt,
        tools: {
          deployFacebookCampaign: deployFacebookCampaignTool(),
          readFile: readFileTool()
        },
        stopWhen: stepCountIs(3),
      })
    },
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  initFacebook()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const prompt = await rl.question("> ")
  rl.close()

  const agent = createFacebookAdAgent()
  console.log("thinking...")
  const result = await agent.run(prompt)
  console.log("done\n")
  console.log(result.text)
}

// async function testDirect() {
//   initFacebook()
//   const account = new AdAccount(AD_ACCOUNT_ID)

//   const campaign = await account.createCampaign([], {
//     [Campaign.Fields.name]: "Test Campaign " + new Date().toISOString(),
//     [Campaign.Fields.objective]: Campaign.Objective.outcome_traffic,
//     [Campaign.Fields.status]: Campaign.Status.paused,
//     [Campaign.Fields.special_ad_categories]: ["NONE"],
//     "is_adset_budget_sharing_enabled": false,
//   })
//   console.log("Campaign:", campaign.id)

//   const adSet = await account.createAdSet([], {
//     [AdSet.Fields.name]: "Test Ad Set",
//     [AdSet.Fields.campaign_id]: campaign.id,
//     [AdSet.Fields.daily_budget]: 5000,
//     [AdSet.Fields.billing_event]: AdSet.BillingEvent.impressions,
//     [AdSet.Fields.optimization_goal]: AdSet.OptimizationGoal.link_clicks,
//     [AdSet.Fields.bid_amount]: 200,
//     [AdSet.Fields.status]: AdSet.Status.paused,
//     [AdSet.Fields.targeting]: {
//       geo_locations: { countries: ["US"] },
//       age_min: 18,
//       age_max: 65,
//     },
//   })
//   console.log("Ad Set:", adSet.id)

//   const imagePath = path.resolve("automotive_business.png")
//   const imageData = fs.readFileSync(imagePath).toString("base64")
//   const adImage = await account.createAdImage([], { bytes: imageData }) as any
//   const imageHash = Object.values(adImage.images as Record<string, { hash: string }>)[0].hash

//   const creative = await account.createAdCreative([], {
//     [AdCreative.Fields.name]: "Test Creative",
//     [AdCreative.Fields.object_story_spec]: {
//       page_id: PAGE_ID,
//       link_data: {
//         link: "https://autouchytil.cz",
//         message: "Test ad copy",
//         image_hash: imageHash,
//       },
//     },
//   })
//   console.log("Creative:", creative.id)

//   const ad = await account.createAd([], {
//     [Ad.Fields.name]: "Test Ad",
//     [Ad.Fields.adset_id]: adSet.id,
//     [Ad.Fields.creative]: { creative_id: creative.id },
//     [Ad.Fields.status]: Ad.Status.paused,
//   })
//   console.log("Ad:", ad.id)
// }

main().catch(err => {
  console.error("\n── Facebook API Error ──────────────────────")
  console.error(JSON.stringify(err, null, 2))
})
