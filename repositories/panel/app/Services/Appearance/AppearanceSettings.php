<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Appearance;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Setting;

/** First-party appearance values. The request-scoped instance avoids repeated settings queries on server lists. */
class AppearanceSettings
{
    public const string PREFIX = 'settings::ibispanel:appearance:';

    public const array DEFAULTS = [
        'accent' => '#00e5ec',
        'default_mode' => 'legacy',
        'allow_user_override' => '1',
        'available_modes' => 'system,oled,light,legacy',
        'navigation_position' => 'left',
        'roundness' => '35',
        'storage_unit' => 'binary',
        'default_language' => 'en',
        'enabled_languages' => 'en,hi,es',
        'allow_language_override' => '1',
        'language_suggestions' => '0',
        'card_layout' => 'premium',
        'glass' => '0',
        'banners_enabled' => '1',
    ];

    public const array ASSETS = [
        'login_logo' => '/brand/ibis-stacked.png',
        'login_logo_light' => '/brand/ibis-stacked.png',
        'nav_logo' => '/brand/ibis-icon-192.png',
        'nav_logo_light' => '/brand/ibis-icon-192.png',
        'favicon' => '/brand/ibis-icon-32.png',
        'login_background' => null,
        'global_banner' => null,
    ];

    private ?array $values = null;

    private array $filesPresent = [];

    public function values(): array
    {
        if ($this->values === null) {
            $this->values = Setting::query()
                ->where('key', 'like', self::PREFIX.'%')
                ->pluck('value', 'key')
                ->mapWithKeys(fn ($value, $key) => [mb_substr($key, mb_strlen(self::PREFIX)) => $value])
                ->all();
        }

        return $this->values;
    }

    public function get(string $key): ?string
    {
        if ($key === 'default_language') {
            return config()->string('app.locale', 'en');
        }

        return $this->values()[$key] ?? self::DEFAULTS[$key] ?? null;
    }

    public function put(string $key, ?string $value): void
    {
        if ($key === 'default_language') {
            Setting::put('settings::app:locale', $value);
            config()->set('app.locale', $value);

            return;
        }

        Setting::put(self::PREFIX.$key, $value);
        $this->values[$key] = $value;
    }

    /** The browser choice is ignored when the provider disables overrides or that mode. */
    public function mode(Request $request): string
    {
        $available = explode(',', $this->get('available_modes') ?? self::DEFAULTS['available_modes']);
        $stored = $request->user()?->getAttributes()['appearance_mode'] ?? $request->cookie('ibis_appearance');
        if ($stored === null) {
            $previous = $request->cookie('pterodactyl_scheme');
            $stored = $previous === 'dark' ? 'legacy' : $previous;
        }
        $default = $this->get('default_mode');
        $default = $default === 'dark' ? 'legacy' : $default;
        $choice = $this->get('allow_user_override') === '1' && is_string($stored) && in_array($stored, $available, true)
            ? $stored : $default;

        return in_array($choice, ['system', 'oled', 'light', 'legacy'], true) ? $choice : 'legacy';
    }

    public function asset(string $key): ?string
    {
        $path = $this->get($key);

        return $path && str_starts_with($path, 'appearance/') && $this->exists($path)
            ? Storage::disk('public')->url($path)
            : (self::ASSETS[$key] ?? null);
    }

    public function bannerFor(Server $server): ?string
    {
        if ($this->get('banners_enabled') !== '1') {
            return null;
        }

        foreach (['server_banner_'.$server->id, 'egg_banner_'.$server->egg_id] as $key) {
            $path = $this->get($key);
            if ($path && str_starts_with($path, 'appearance/') && $this->exists($path)) {
                return Storage::disk('public')->url($path);
            }
        }

        $artwork = app(WorkloadArtwork::class);
        $category = $artwork->category($server);
        if ($category !== 'generic-server') {
            return $artwork->banner($category);
        }

        return $this->uploadedImage('global_banner') ?? $artwork->banner($category);
    }

    public function iconFor(Server $server): string
    {
        return $this->uploadedImage('server_icon_'.$server->id)
            ?? $this->uploadedImage('egg_icon_'.$server->egg_id)
            ?? app(WorkloadArtwork::class)->icon(app(WorkloadArtwork::class)->category($server));
    }

    public function manifestIcon(): array
    {
        $path = $this->get('favicon');
        if ($path && str_starts_with($path, 'appearance/') && $this->exists($path)) {
            $dimensions = @getimagesizefromstring(Storage::disk('public')->get($path));
            if ($dimensions) {
                return ['src' => Storage::disk('public')->url($path), 'sizes' => $dimensions[0].'x'.$dimensions[1], 'type' => $dimensions['mime']];
            }
        }

        return ['src' => '/brand/ibis-icon-192.png', 'sizes' => '192x192', 'type' => 'image/png'];
    }

    public function publicValues(): array
    {
        $assets = [];
        foreach (array_keys(self::ASSETS) as $key) {
            $assets[$key] = $this->asset($key);
        }

        return [
            'accent' => $this->get('accent'),
            'default_mode' => $this->get('default_mode') === 'dark' ? 'legacy' : $this->get('default_mode'),
            'allow_user_override' => $this->get('allow_user_override') === '1',
            'available_modes' => explode(',', $this->get('available_modes') ?? self::DEFAULTS['available_modes']),
            'navigation_position' => $this->get('navigation_position'),
            'roundness' => (int) $this->get('roundness'),
            'storage_unit' => $this->get('storage_unit'),
            'default_language' => $this->get('default_language'),
            'enabled_languages' => explode(',', $this->get('enabled_languages') ?? self::DEFAULTS['enabled_languages']),
            'allow_language_override' => $this->get('allow_language_override') === '1',
            'language_suggestions' => $this->get('language_suggestions') === '1',
            'card_layout' => $this->get('card_layout'),
            'glass' => $this->get('glass') === '1',
            'banners_enabled' => $this->get('banners_enabled') === '1',
            'assets' => $assets,
        ];
    }

    public function adminValues(): array
    {
        return [
            ...$this->publicValues(),
            'company_name' => config('app.name', 'IbisPanel'),
            'egg_banners' => $this->bannerMap('egg_banner_'),
            'server_banners' => $this->bannerMap('server_banner_'),
            'egg_icons' => $this->bannerMap('egg_icon_'),
            'server_icons' => $this->bannerMap('server_icon_'),
        ];
    }

    private function uploadedImage(string $key): ?string
    {
        $path = $this->get($key);

        return $path && str_starts_with($path, 'appearance/') && $this->exists($path)
            ? Storage::disk('public')->url($path) : null;
    }

    private function bannerMap(string $prefix): array
    {
        $result = [];
        foreach ($this->values() as $key => $path) {
            if (str_starts_with($key, $prefix)) {
                $id = mb_substr($key, mb_strlen($prefix));
                $result[$id] = $this->asset($key);
            }
        }

        return $result;
    }

    private function exists(string $path): bool
    {
        return $this->filesPresent[$path] ??= Storage::disk('public')->exists($path);
    }
}
