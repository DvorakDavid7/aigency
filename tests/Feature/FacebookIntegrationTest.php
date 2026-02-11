<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\FacebookGraph\FacebookGraph;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('integration')]
final class FacebookIntegrationTest extends TestCase
{
    private FacebookGraph $graph;

    private string $campaignId = '';

    private string $adAccountId = '1393071921792663';

    private string $pageId = '700607016477431';

    private string $imageName = 'test-ad-image.jpg';

    protected function setUp(): void
    {
        parent::setUp();

        $token = env('FACEBOOK_API_TOKEN');

        if (empty($token)) {
            $this->markTestSkipped('FACEBOOK_API_TOKEN is not set.');
        }

        $this->graph = new FacebookGraph($token);
    }

    protected function tearDown(): void
    {
        if ($this->campaignId !== '') {
            $this->graph->campaigns()->delete($this->campaignId);
        }

        parent::tearDown();
    }

    public function test_full_ad_funnel(): void
    {
        $campaign = $this->graph->campaigns()->create($this->adAccountId, [
            'name' => 'Integration Test Campaign',
            'objective' => 'OUTCOME_SALES',
            'status' => 'PAUSED',
            'buying_type' => 'AUCTION',
            'bid_strategy' => 'LOWEST_COST_WITHOUT_CAP',
            'daily_budget' => '10000', // 100 kc
            'special_ad_categories' => 'NONE',
            'is_adset_budget_sharing_enabled' => 'false',
        ]);

        $this->campaignId = $campaign['id'];

        $this->assertArrayHasKey('id', $campaign);

        $adset = $this->graph->adSets()->create($this->adAccountId, [
            'name' => 'Integration Test AdSet',
            'campaign_id' => $campaign['id'],
            'billing_event' => 'IMPRESSIONS',
            'optimization_goal' => 'LINK_CLICKS',
            'targeting' => [
                'geo_locations' => [
                    'countries' => ['CZ'],
                ],
                'age_min' => 18,
                'age_max' => 65,
            ],
        ]);

        $this->assertArrayHasKey('id', $adset);

        $this->assertTrue(Storage::disk('local')->exists($this->imageName), 'Test image not found in local storage.');

        $image = Storage::disk('local')->get($this->imageName);
        $result = $this->graph->adImages()->create($this->adAccountId, $this->imageName, $image);
        $imageHash = $result['images'][$this->imageName]['hash'] ?? null;

        $this->assertNotEmpty($imageHash, 'Image upload did not return a hash.');

        $adcreative = $this->graph->adCreatives()->create($this->adAccountId, [
            'name' => 'Integration Test Creative',
            'object_story_spec' => [
                'page_id' => $this->pageId,
                'link_data' => [
                    'message' => 'Check out our new website!',
                    'link' => 'https://autouchytil.cz',
                    'image_hash' => $imageHash,
                    'call_to_action' => [
                        'type' => 'SHOP_NOW',
                    ],
                ],
            ],
        ]);

        $this->assertArrayHasKey('id', $adcreative);

        $ad = $this->graph->ads()->create($this->adAccountId, [
            'name' => 'Integration Test Ad',
            'adset_id' => $adset['id'],
            'status' => 'PAUSED',
            'creative' => [
                'creative_id' => $adcreative['id'],
            ],
        ]);

        $this->assertArrayHasKey('id', $ad);

        $result = $this->graph->campaigns()->delete($this->campaignId);
        $this->campaignId = '';

        $this->assertTrue($result['success']);
    }

    public function test_upload_ad_image(): void
    {
        $this->markTestSkipped('File upload manual run only.');

        $image = Storage::disk('local')->get($this->imageName);
        $result = $this->graph->adImages()->create($this->adAccountId, $this->imageName, $image);

        $this->assertArrayHasKey('images', $result);
        $this->assertArrayHasKey($this->imageName, $result['images']);
        $this->assertNotEmpty($result['images'][$this->imageName]['hash']);
    }
}
