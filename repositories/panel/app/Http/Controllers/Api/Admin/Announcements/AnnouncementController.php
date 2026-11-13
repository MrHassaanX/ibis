<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Admin\Announcements;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Http\Controllers\Api\Admin\AdminApiController;
use Pterodactyl\Models\Announcement;

#[Group('Admin API', 'Root administrator endpoints for managing panel configuration and resources.')]
#[Subgroup('Announcements', 'Manage dashboard notices.')]
class AnnouncementController extends AdminApiController
{
    #[Endpoint('List announcements', 'Returns administrator-managed announcements, including drafts and scheduled notices.')]
    #[ScribeResponse(['data' => [['id' => 1, 'title' => 'Maintenance', 'body' => 'Planned work', 'type' => 'info', 'published' => true, 'dismissible' => true, 'starts_at' => null, 'expires_at' => null]], 'current_page' => 1, 'total' => 1], description: 'Announcements returned.')]
    public function index(): JsonResponse
    {
        return response()->json(Announcement::query()->orderByDesc('created_at')->paginate(50));
    }

    #[Endpoint('Create announcement', 'Creates a dashboard announcement.')]
    #[ScribeResponse(['id' => 1, 'title' => 'Maintenance', 'body' => 'Planned work', 'type' => 'info', 'published' => false, 'dismissible' => true, 'starts_at' => null, 'expires_at' => null], status: 201, description: 'Announcement created.')]
    public function store(Request $request): JsonResponse
    {
        return response()->json(Announcement::query()->create($this->validated($request)), 201);
    }

    #[Endpoint('Update announcement', 'Changes an existing announcement, including its schedule and publication state.')]
    #[ScribeResponse(['id' => 1, 'title' => 'Maintenance', 'body' => 'Planned work', 'type' => 'info', 'published' => true, 'dismissible' => true, 'starts_at' => null, 'expires_at' => null], description: 'Announcement updated.')]
    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->update($this->validated($request));
        if ($announcement->wasChanged(['title', 'body'])) {
            $announcement->dismissedBy()->detach();
        }

        return response()->json($announcement->refresh());
    }

    #[Endpoint('Delete announcement', 'Deletes an announcement and its dismissals.')]
    #[ScribeResponse(status: 204, description: 'Announcement deleted.')]
    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:5000'],
            'type' => ['required', Rule::in(['info', 'success', 'warning', 'danger'])],
            'published' => ['required', 'boolean'],
            'dismissible' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
        ]);
    }
}
