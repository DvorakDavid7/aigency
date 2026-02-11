<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\FacebookGraph\FacebookGraph;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class FacebookGraphTest extends TestCase
{
    public function test_paginate_iterates_through_all_pages(): void
    {
        Http::fakeSequence()
            ->push([
                'data' => [
                    ['id' => 'act_1', 'name' => 'Account 1'],
                    ['id' => 'act_2', 'name' => 'Account 2'],
                ],
                'paging' => [
                    'cursors' => ['after' => 'cursor_abc'],
                    'next' => 'https://graph.facebook.com/v24.0/me/adaccounts?after=cursor_abc',
                ],
            ])
            ->push([
                'data' => [
                    ['id' => 'act_3', 'name' => 'Account 3'],
                ],
                'paging' => [
                    'cursors' => ['after' => 'cursor_def'],
                ],
            ]);

        $graph = new FacebookGraph('fake-token');
        $results = $graph->adAccounts()->all();

        $this->assertCount(3, $results);
        $this->assertEquals('act_1', $results[0]['id']);
        $this->assertEquals('act_2', $results[1]['id']);
        $this->assertEquals('act_3', $results[2]['id']);

        Http::assertSentCount(2);
    }

    public function test_paginate_handles_single_page(): void
    {
        Http::fakeSequence()
            ->push([
                'data' => [
                    ['id' => 'act_1', 'name' => 'Account 1'],
                ],
                'paging' => [
                    'cursors' => ['after' => 'cursor_abc'],
                ],
            ]);

        $graph = new FacebookGraph('fake-token');
        $results = $graph->adAccounts()->all();

        $this->assertCount(1, $results);
        $this->assertEquals('act_1', $results[0]['id']);

        Http::assertSentCount(1);
    }

    public function test_paginate_handles_empty_response(): void
    {
        Http::fakeSequence()
            ->push([
                'data' => [],
            ]);

        $graph = new FacebookGraph('fake-token');
        $results = $graph->adAccounts()->all();

        $this->assertCount(0, $results);

        Http::assertSentCount(1);
    }

    public function test_paginate_continues_through_empty_pages_when_next_exists(): void
    {
        Http::fakeSequence()
            ->push([
                'data' => [],
                'paging' => [
                    'cursors' => ['after' => 'cursor_abc'],
                    'next' => 'https://graph.facebook.com/v24.0/me/adaccounts?after=cursor_abc',
                ],
            ])
            ->push([
                'data' => [
                    ['id' => 'act_1', 'name' => 'Account 1'],
                ],
                'paging' => [
                    'cursors' => ['after' => 'cursor_def'],
                ],
            ]);

        $graph = new FacebookGraph('fake-token');
        $results = $graph->adAccounts()->all();

        $this->assertCount(1, $results);
        $this->assertEquals('act_1', $results[0]['id']);

        Http::assertSentCount(2);
    }

    public function test_create_campaign_posts_to_correct_endpoint(): void
    {
        Http::fake([
            'graph.facebook.com/v24.0/act_123/campaigns' => Http::response(['id' => '456']),
        ]);

        $graph = new FacebookGraph('fake-token');
        $result = $graph->campaigns()->create('123', [
            'name' => 'Test Campaign',
            'objective' => 'OUTCOME_TRAFFIC',
            'status' => 'PAUSED',
            'special_ad_categories' => ['NONE'],
        ]);

        $this->assertEquals('456', $result['id']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://graph.facebook.com/v24.0/act_123/campaigns'
                && $request['name'] === 'Test Campaign'
                && $request['objective'] === 'OUTCOME_TRAFFIC'
                && $request['status'] === 'PAUSED';
        });
    }

    public function test_create_ad_set_posts_to_correct_endpoint(): void
    {
        Http::fake([
            'graph.facebook.com/v24.0/act_123/adsets' => Http::response(['id' => '789']),
        ]);

        $graph = new FacebookGraph('fake-token');
        $result = $graph->adSets()->create('123', [
            'name' => 'My Test Ad Set',
            'campaign_id' => '456',
            'daily_budget' => 10000,
            'billing_event' => 'IMPRESSIONS',
            'optimization_goal' => 'LINK_CLICKS',
            'bid_amount' => 200,
            'status' => 'PAUSED',
            'targeting' => [
                'geo_locations' => ['countries' => ['US']],
                'age_min' => 18,
                'age_max' => 65,
            ],
        ]);

        $this->assertEquals('789', $result['id']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://graph.facebook.com/v24.0/act_123/adsets'
                && $request['campaign_id'] === '456';
        });
    }

    public function test_create_ad_creative_posts_to_correct_endpoint(): void
    {
        Http::fake([
            'graph.facebook.com/v24.0/act_123/adcreatives' => Http::response(['id' => '101']),
        ]);

        $graph = new FacebookGraph('fake-token');
        $result = $graph->adCreatives()->create('123', [
            'name' => 'My Test Creative',
            'object_story_spec' => [
                'page_id' => '700607016477431',
                'link_data' => [
                    'link' => 'https://example.com',
                    'message' => 'Check out our website!',
                ],
            ],
        ]);

        $this->assertEquals('101', $result['id']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://graph.facebook.com/v24.0/act_123/adcreatives'
                && $request['name'] === 'My Test Creative';
        });
    }

    public function test_create_ad_posts_to_correct_endpoint(): void
    {
        Http::fake([
            'graph.facebook.com/v24.0/act_123/ads' => Http::response(['id' => '202']),
        ]);

        $graph = new FacebookGraph('fake-token');
        $result = $graph->ads()->create('123', [
            'name' => 'My Test Ad',
            'adset_id' => '789',
            'creative' => ['creative_id' => '101'],
            'status' => 'PAUSED',
        ]);

        $this->assertEquals('202', $result['id']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://graph.facebook.com/v24.0/act_123/ads'
                && $request['adset_id'] === '789';
        });
    }
}
