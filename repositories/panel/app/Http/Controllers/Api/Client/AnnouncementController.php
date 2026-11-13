<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Models\Announcement;

#[Group('Client API', 'Endpoints authenticated as a panel user using a client API token.')]
#[Subgroup('Announcements', 'Read and dismiss active dashboard notices.')]
class AnnouncementController extends ClientApiController
{
    #[Endpoint('List active announcements', 'Returns currently published notices that this user has not dismissed.')]
    #[ScribeResponse([['id' => 1, 'title' => 'Maintenance', 'body' => 'Planned work', 'type' => 'info', 'published' => true, 'dismissible' => true, 'starts_at' => null, 'expires_at' => null]], description: 'Active announcements returned.')]
    public function index(Request $request): JsonResponse
    {
        $items = Announcement::query()->active()
            ->whereNotIn('id', fn ($query) => $query->select('announcement_id')->from('announcement_dismissals')->where('user_id', $request->user()->id))
            ->orderByDesc('created_at')->limit(10)->get();

        return response()->json($items);
    }

    #[Endpoint('Dismiss announcement', 'Hides a dismissible announcement for the current user.')]
    #[ScribeResponse(status: 204, description: 'Announcement dismissed.')]
    public function dismiss(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($announcement->dismissible && $announcement->published, 404);
        $announcement->dismissedBy()->syncWithoutDetaching([$request->user()->id]);

        return response()->json(null, 204);
    }
}
