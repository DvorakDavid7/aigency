<?php

declare(strict_types=1);

namespace App\Services\FacebookGraph\Resources;

use App\Services\FacebookGraph\FacebookGraph;

final class AdImages
{
    public function __construct(private FacebookGraph $client) {}

    /**
     * @return array<string, mixed>
     */
    public function create(string $adAccountId, string $imageName, string $imageData): array
    {
        return $this->client->request()
            ->post($this->client->baseUrl()."/act_{$adAccountId}/adimages", [
                'name' => $imageName,
                'bytes' => base64_encode($imageData),
            ])
            ->json();
    }
}
