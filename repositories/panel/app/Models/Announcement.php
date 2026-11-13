<?php

declare(strict_types=1);

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Announcement extends Model
{
    protected $fillable = ['title', 'body', 'type', 'published', 'dismissible', 'starts_at', 'expires_at'];

    protected function casts(): array
    {
        return ['published' => 'boolean', 'dismissible' => 'boolean', 'starts_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function dismissedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'announcement_dismissals')->withPivot('created_at');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('published', true)
            ->where(fn (Builder $query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
