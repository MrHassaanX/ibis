<?php

declare(strict_types=1);

namespace Pterodactyl\Models;

use Database\Factories\LocationFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Guarded(['id', 'created_at', 'updated_at'])]
class Location extends Model
{
    /** @use HasFactory<LocationFactory> */
    use HasFactory;

    public const string RESOURCE_NAME = 'location';

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    /** @return array{country_code: string|null, name: string, label: string|null}|null */
    public function clientRegion(): ?array
    {
        if (! $this->region_visible) {
            return null;
        }

        $countryCode = mb_strtoupper(trim((string) $this->country_code));
        $name = trim((string) $this->region_name);
        $label = trim((string) $this->display_label);

        // Older locations can be visible without complete region metadata. Use their stored name.
        $name = $name !== '' ? $name : trim((string) ($this->long ?: $this->short));

        return [
            'country_code' => preg_match('/^[A-Z]{2}$/D', $countryCode) ? $countryCode : null,
            'name' => $name,
            'label' => $label !== '' ? $label : null,
        ];
    }

    /**
     * @return HasMany<Node, $this>
     */
    public function nodes(): HasMany
    {
        return $this->hasMany(Node::class);
    }

    /**
     * @return HasManyThrough<Server, Node, $this>
     */
    public function servers(): HasManyThrough
    {
        return $this->hasManyThrough(Server::class, Node::class);
    }
}
