<?php

declare(strict_types=1);

namespace App\Services\FacebookGraph;

use App\Services\FacebookGraph\Resources\AdCreatives;
use App\Services\FacebookGraph\Resources\AdImages;
use App\Services\FacebookGraph\Resources\Ads;
use App\Services\FacebookGraph\Resources\AdSets;
use App\Services\FacebookGraph\Resources\Campaigns;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\LazyCollection;

final class FacebookGraph
{
    private const string BASE_URL = 'https://graph.facebook.com/v24.0';

    public function __construct(private string $accessToken) {}

    public function campaigns(): Campaigns
    {
        return new Campaigns($this);
    }

    public function adSets(): AdSets
    {
        return new AdSets($this);
    }

    public function adCreatives(): AdCreatives
    {
        return new AdCreatives($this);
    }

    public function ads(): Ads
    {
        return new Ads($this);
    }

    public function adImages(): AdImages
    {
        return new AdImages($this);
    }

    /**
     * @param  string[]  $fields
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    public function me(array $fields = ['id', 'name', 'email'], array $params = []): array
    {
        return $this->get('/me', ['fields' => implode(',', $fields), ...$params])->json();
    }

    /**
     * @param  string[]  $fields
     * @param  array<string, mixed>  $params
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function adAccounts(array $fields = ['id', 'name', 'account_status'], array $params = []): LazyCollection
    {
        return $this->paginate('/me/adaccounts', ['fields' => implode(',', $fields), ...$params]);
    }

    /**
     * @param  string[]  $fields
     * @param  array<string, mixed>  $params
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function pages(array $fields = ['id', 'name', 'category'], array $params = []): LazyCollection
    {
        return $this->paginate('/me/accounts', ['fields' => implode(',', $fields), ...$params]);
    }

    public function baseUrl(): string
    {
        return self::BASE_URL;
    }

    /**
     * @param  array<string, mixed>  $params
     */
    public function get(string $endpoint, array $params = []): Response
    {
        return $this->request()->get(self::BASE_URL.$endpoint, $params);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function post(string $endpoint, array $data = []): Response
    {
        return $this->request()->post(self::BASE_URL.$endpoint, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function delete(string $endpoint, array $data = []): Response
    {
        return $this->request()->delete(self::BASE_URL.$endpoint, $data);
    }

    /**
     * @return PendingRequest<false>
     */
    public function request(): PendingRequest
    {
        return Http::withToken($this->accessToken);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LazyCollection<int, array<string, mixed>>
     */
    public function paginate(string $endpoint, array $params = []): LazyCollection
    {
        return LazyCollection::make(function () use ($endpoint, $params) {
            $response = $this->get($endpoint, $params)->json();

            while (true) {
                foreach ($response['data'] ?? [] as $item) {
                    yield $item;
                }

                $nextUrl = $response['paging']['next'] ?? null;

                if ($nextUrl === null) {
                    break;
                }

                $response = $this->request()->get($nextUrl)->json();
            }
        });
    }
}
