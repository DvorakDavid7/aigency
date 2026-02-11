<?php

declare(strict_types=1);

namespace App\Services\FacebookGraph\Resources;

use App\Services\FacebookGraph\FacebookGraph;

final class AdSets
{
    public function __construct(private FacebookGraph $client) {}

    /**
     * @param  array<string, mixed>  $params
     * @param  array<int, string>  $fields
     * @return array<string, mixed>
     */
    public function create(string $adAccountId, array $params, array $fields = ['id']): array
    {
        return $this->client->post("/act_{$adAccountId}/adsets", ['fields' => implode(',', $fields), ...$params])->json();
    }
}
