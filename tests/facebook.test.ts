import { User, FacebookAdsApi, AdAccount, Campaign, AdSet, AdCreative, Ad } from "facebook-nodejs-business-sdk";
import { beforeAll, it } from "vitest"

beforeAll(() => {
  const token = process.env.FACEBOOK_API_TOKEN!
  const api = FacebookAdsApi.init(token);
  // api.setDebug(true);
})

it("should list facebook pages", async () => {
  const user = new User("me");
  const pages = await user.getAccounts(['id', 'name', 'category']);
  for (const page of pages) {
    console.log(page.id, page.name, page.category);
  }
})

it("should create campaign", async () => {
  const ad_account_id = 'act_1393071921792663';

  const account = new AdAccount(ad_account_id);

  const campaign = await account.createCampaign(
    [],
    {
      [Campaign.Fields.name]: 'Test Campaign ' + new Date(),
      [Campaign.Fields.objective]: Campaign.Objective.outcome_traffic,
      [Campaign.Fields.status]: Campaign.Status.paused,
      [Campaign.Fields.special_ad_categories]: ["NONE"],
      "is_adset_budget_sharing_enabled": false,
    }
  )
  const campaignId = campaign.id;
  console.log('Campaign created:', campaignId);

  // 2. Create an ad set under the campaign
  const adSet = await account.createAdSet([], {
    [AdSet.Fields.name]: 'My Test Ad Set',
    [AdSet.Fields.campaign_id]: campaignId,
    [AdSet.Fields.daily_budget]: 10000, // 100 kc
    [AdSet.Fields.billing_event]: AdSet.BillingEvent.impressions,
    [AdSet.Fields.optimization_goal]: AdSet.OptimizationGoal.link_clicks,
    [AdSet.Fields.bid_amount]: 200, // in cents ($2.00)
    [AdSet.Fields.status]: AdSet.Status.paused,
    [AdSet.Fields.targeting]: {
      geo_locations: { countries: ['US'] },
      age_min: 18,
      age_max: 65,
    },
  });
  const adSetId = adSet.id;
  console.log('Ad Set created:', adSetId);

  // // 3. Create an ad creative with a simple post
  const creative = await account.createAdCreative([], {
    [AdCreative.Fields.name]: 'My Test Creative',
    [AdCreative.Fields.object_story_spec]: {
      page_id: '700607016477431',
      link_data: {
        link: 'https://autouchytil.cz',
        message: 'Check out our website!',
      },
    },
  });
  const creativeId = creative.id;
  console.log('Creative created:', creativeId);

  // 4. Create an ad linking the ad set and creative
  const ad = await account.createAd([], {
    [Ad.Fields.name]: 'My Test Ad',
    [Ad.Fields.adset_id]: adSetId,
    [Ad.Fields.creative]: { creative_id: creativeId },
    [Ad.Fields.status]: Ad.Status.paused,
  });
  console.log('Ad created:', ad.id);
})
