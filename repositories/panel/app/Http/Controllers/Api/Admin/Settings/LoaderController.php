<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Admin\Settings;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Http\Controllers\Api\Admin\AdminApiController;
use Pterodactyl\Models\Setting;

#[Group('Admin API', 'Root administrator endpoints for managing panel configuration and resources.')]
#[Subgroup('Settings', 'View and update global panel settings.')]
class LoaderController extends AdminApiController
{
    private const string KEY = 'settings::ibispanel:loader';

    public static function url(): ?string
    {
        $path = Setting::fetch(self::KEY);

        return $path && str_starts_with($path, 'loaders/') && Storage::disk('public')->exists($path)
            ? Storage::disk('public')->url($path)
            : null;
    }

    #[Endpoint('Get loader', 'Returns the active custom loading image, or null for the default IbisPanel loader.')]
    #[ScribeResponse(['url' => null], description: 'Loader configuration returned.')]
    public function show(): JsonResponse
    {
        return response()->json(['url' => self::url()]);
    }

    #[Endpoint('Upload loader', 'Validates and stores a GIF, PNG, JPEG, or WebP loading image.')]
    #[ScribeResponse(['url' => '/storage/loaders/example.webp'], description: 'Loader updated.')]
    public function store(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', File::image()->types(['gif', 'png', 'jpg', 'jpeg', 'webp'])->max(2048), 'dimensions:max_width=1200,max_height=1200']]);
        $old = Setting::fetch(self::KEY);
        $path = $request->file('image')->store('loaders', 'public');
        Setting::put(self::KEY, $path);
        if ($old && str_starts_with($old, 'loaders/')) {
            Storage::disk('public')->delete($old);
        }

        return $this->show();
    }

    #[Endpoint('Reset loader', 'Removes the custom image and restores the default IbisPanel loader.')]
    #[ScribeResponse(['url' => null], description: 'Default loader restored.')]
    public function destroy(): JsonResponse
    {
        $old = Setting::fetch(self::KEY);
        Setting::put(self::KEY, '');
        if ($old && str_starts_with($old, 'loaders/')) {
            Storage::disk('public')->delete($old);
        }

        return $this->show();
    }
}
