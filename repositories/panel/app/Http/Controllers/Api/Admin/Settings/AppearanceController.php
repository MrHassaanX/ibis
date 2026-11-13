<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Admin\Settings;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\ValidationException;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Http\Controllers\Api\Admin\AdminApiController;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Setting;
use Pterodactyl\Services\Appearance\AppearanceSettings;

#[Group('Admin API', 'Root administrator endpoints for managing panel configuration and resources.')]
#[Subgroup('Settings', 'View and update global panel settings.')]
class AppearanceController extends AdminApiController
{
    #[Endpoint('Get appearance settings', 'Returns the first-party branding, theme, card and banner settings.')]
    #[ScribeResponse(['company_name' => 'IbisPanel', 'accent' => '#00e5ec', 'default_mode' => 'legacy', 'navigation_position' => 'left', 'roundness' => 35, 'storage_unit' => 'binary', 'card_layout' => 'compact', 'glass' => false, 'banners_enabled' => true], description: 'Appearance returned, including asset and banner maps.')]
    public function show(AppearanceSettings $appearance): JsonResponse
    {
        return response()->json($appearance->adminValues());
    }

    #[Endpoint('Update appearance settings', 'Sets the company name, accent, default scheme, card layout, glass and banner visibility.')]
    #[ScribeResponse(['company_name' => 'IbisPanel', 'accent' => '#00e5ec', 'default_mode' => 'legacy', 'navigation_position' => 'left', 'roundness' => 35, 'storage_unit' => 'binary', 'card_layout' => 'compact', 'glass' => false, 'banners_enabled' => true], description: 'Appearance updated, including asset and banner maps.')]
    public function update(Request $request, AppearanceSettings $appearance): JsonResponse
    {
        abort_if(config('pterodactyl.load_environment_only'), 403);
        $request->merge(['company_name' => trim((string) $request->input('company_name'))]);
        $data = $request->validate([
            'company_name' => ['required', 'string', 'min:1', 'max:100'],
            'accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'default_mode' => ['required', Rule::in(['system', 'oled', 'light', 'legacy'])],
            'allow_user_override' => ['required', 'boolean'],
            'available_modes' => ['required', 'array', 'min:1'],
            'available_modes.*' => [Rule::in(['system', 'oled', 'light', 'legacy']), 'distinct'],
            'navigation_position' => ['required', Rule::in(['left', 'top'])],
            'roundness' => ['required', 'integer', 'between:0,100'],
            'storage_unit' => ['required', Rule::in(['decimal', 'binary'])],
            'default_language' => ['required', Rule::in(['en', 'hi', 'es'])],
            'enabled_languages' => ['required', 'array', 'min:1'],
            'enabled_languages.*' => [Rule::in(['en', 'hi', 'es']), 'distinct'],
            'allow_language_override' => ['required', 'boolean'],
            'language_suggestions' => ['required', 'boolean'],
            'card_layout' => ['required', Rule::in(['compact', 'premium', 'banner'])],
            'glass' => ['required', 'boolean'],
            'banners_enabled' => ['required', 'boolean'],
        ]);
        if ($data['company_name'] === '') {
            throw ValidationException::withMessages(['company_name' => 'Enter a company name.']);
        }
        if ($this->contrastWithNavy($data['accent']) < 4.5) {
            throw ValidationException::withMessages(['accent' => 'Choose a brighter accent for readable controls in dark mode.']);
        }
        if (! in_array($data['default_mode'], $data['available_modes'], true)) {
            throw ValidationException::withMessages(['available_modes' => 'Include the default appearance in the available modes.']);
        }
        if (! in_array($data['default_language'], $data['enabled_languages'], true)) {
            throw ValidationException::withMessages(['enabled_languages' => 'Include the default language in the enabled languages.']);
        }

        Setting::put('settings::app:name', $data['company_name']);
        config()->set('app.name', $data['company_name']);
        unset($data['company_name']);

        foreach ($data as $key => $value) {
            $appearance->put($key, is_array($value) ? implode(',', $value) : (is_bool($value) ? ($value ? '1' : '0') : (string) $value));
        }

        return $this->show($appearance);
    }

    #[Endpoint('Reset appearance defaults', 'Restores theme, layout and effect defaults without deleting brand images.')]
    #[ScribeResponse(['card_layout' => 'compact', 'default_mode' => 'legacy'], description: 'Defaults restored.')]
    public function reset(AppearanceSettings $appearance): JsonResponse
    {
        abort_if(config('pterodactyl.load_environment_only'), 403);
        foreach (AppearanceSettings::DEFAULTS as $key => $value) {
            $appearance->put($key, $value);
        }

        return $this->show($appearance);
    }

    #[Endpoint('Upload appearance image', 'Validates and stores a brand image or an Egg, server or global banner.')]
    #[ScribeResponse(['company_name' => 'IbisPanel'], description: 'Image updated; the response also includes the updated asset and banner maps.')]
    public function upload(Request $request, AppearanceSettings $appearance): JsonResponse
    {
        abort_if(config('pterodactyl.load_environment_only'), 403);
        $data = $request->validate([
            'slot' => ['required', Rule::in([...array_keys(AppearanceSettings::ASSETS), 'egg_banner', 'server_banner', 'egg_icon', 'server_icon'])],
            'target_id' => ['required_if:slot,egg_banner,server_banner,egg_icon,server_icon', 'nullable', 'integer', 'min:1'],
            'image' => ['required', File::image()->types(['png', 'jpg', 'jpeg', 'webp'])->max(in_array($request->input('slot'), ['favicon', 'egg_icon', 'server_icon'], true) ? 512 : 4096), in_array($request->input('slot'), ['favicon', 'egg_icon', 'server_icon'], true) ? 'dimensions:ratio=1/1,max_width=512,max_height=512' : 'dimensions:max_width=3200,max_height=1800'],
        ]);
        $key = $this->key($data['slot'], $data['target_id'] ?? null);
        $old = $appearance->get($key);
        $path = $request->file('image')->store('appearance', 'public');
        $appearance->put($key, $path);
        $this->removeOwnedFile($old);

        return $this->show($appearance);
    }

    #[Endpoint('Reset appearance image', 'Removes one uploaded image and restores its default or inherited banner.')]
    #[ScribeResponse(['company_name' => 'IbisPanel'], description: 'Image restored; the response also includes the updated asset and banner maps.')]
    public function clear(Request $request, AppearanceSettings $appearance): JsonResponse
    {
        abort_if(config('pterodactyl.load_environment_only'), 403);
        $data = $request->validate([
            'slot' => ['required', Rule::in([...array_keys(AppearanceSettings::ASSETS), 'egg_banner', 'server_banner', 'egg_icon', 'server_icon'])],
            'target_id' => ['required_if:slot,egg_banner,server_banner,egg_icon,server_icon', 'nullable', 'integer', 'min:1'],
        ]);
        $key = $this->key($data['slot'], $data['target_id'] ?? null);
        $old = $appearance->get($key);
        $appearance->put($key, '');
        $this->removeOwnedFile($old);

        return $this->show($appearance);
    }

    private function key(string $slot, ?int $id): string
    {
        if (in_array($slot, ['egg_banner', 'egg_icon'], true)) {
            abort_unless(Egg::query()->whereKey($id)->exists(), 404);

            return $slot.'_'.$id;
        }

        if (in_array($slot, ['server_banner', 'server_icon'], true)) {
            abort_unless(Server::query()->whereKey($id)->exists(), 404);

            return $slot.'_'.$id;
        }

        return $slot;
    }

    private function removeOwnedFile(?string $path): void
    {
        if ($path && str_starts_with($path, 'appearance/')) {
            Storage::disk('public')->delete($path);
        }
    }

    private function contrastWithNavy(string $hex): float
    {
        $rgb = array_map(fn ($part) => hexdec($part) / 255, mb_str_split(mb_substr($hex, 1), 2));
        $linear = array_map(fn ($channel) => $channel <= 0.04045 ? $channel / 12.92 : (($channel + 0.055) / 1.055) ** 2.4, $rgb);
        $luminance = 0.2126 * $linear[0] + 0.7152 * $linear[1] + 0.0722 * $linear[2];

        return ($luminance + 0.05) / (0.015 + 0.05);
    }
}
