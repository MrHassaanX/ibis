<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Contracts\Users\UpdatesUserEmails;
use Pterodactyl\Contracts\Users\UpdatesUserPasswords;
use Pterodactyl\Contracts\Users\UpdatesUsers;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Extensions\Scribe\Attributes\ResponseFromResource;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdateEmailRequest;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdatePasswordRequest;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdateProfileRequest;
use Pterodactyl\Http\Resources\Api\Client\AccountResource;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Appearance\AppearanceSettings;
use Throwable;

#[Group('Client API', 'Endpoints authenticated as a panel user using a client API token.')]
#[Subgroup('Account', 'View and update the authenticated user account.')]
class AccountController extends ClientApiController
{
    private const array INVALID_PASSWORD_ERROR = [
        'errors' => [
            [
                'code' => 'InvalidPasswordProvidedException',
                'status' => '400',
                'detail' => 'The password provided was invalid for this account.',
            ],
        ],
    ];

    private const array THROTTLED_ERROR = [
        'errors' => [
            [
                'code' => 'TooManyRequestsHttpException',
                'status' => '429',
                'detail' => 'Your email address has been changed too many times today. Please try again later.',
            ],
        ],
    ];

    #[Endpoint('Get account', 'Returns profile details for the authenticated user.')]
    #[ResponseFromResource(AccountResource::class, User::class, resourceKey: 'user')]
    public function index(Request $request): AccountResource
    {
        return AccountResource::make($request->user());
    }

    #[Endpoint('Update account profile', 'Updates the authenticated user’s first name, last name and username. Changing the username requires the current password.')]
    #[BodyParam('current_password', 'string', 'Current password, required when changing the username.', required: false)]
    #[ResponseFromResource(AccountResource::class, User::class, resourceKey: 'user')]
    public function updateProfile(UpdateProfileRequest $request, UpdatesUsers $users): AccountResource
    {
        $user = $request->user();
        $original = [$user->name_first, $user->name_last, $user->username];
        $updated = $users->update($user, [
            'name_first' => $request->string('first_name')->toString(),
            'name_last' => $request->string('last_name')->toString(),
            'username' => $request->string('username')->toString(),
        ]);

        if ($original !== [$updated->name_first, $updated->name_last, $updated->username]) {
            Activity::event('user:account.profile-updated')->subject($updated)->log();
        }

        return AccountResource::make($updated);
    }

    /**
     * Update the authenticated user's email address.
     */
    #[Endpoint('Update account email', "Updates the authenticated user's email address after verifying their current password.")]
    #[BodyParam('password', 'string', 'The current account password.', required: true, example: 'current-password')]
    #[ScribeResponse(status: 204, description: 'Email address updated.')]
    #[ScribeResponse(self::INVALID_PASSWORD_ERROR, status: 400, description: 'The current password is invalid.')]
    #[ScribeResponse(self::THROTTLED_ERROR, status: 429, description: 'The account has changed email too many times in the current throttle window.')]
    public function updateEmail(UpdateEmailRequest $request, UpdatesUserEmails $emails): JsonResponse
    {
        $emails->update($request->user(), $request->string('email')->toString());

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Update the authenticated user's password. All existing sessions will be logged
     * out immediately.
     *
     * @throws Throwable
     */
    #[Endpoint('Update account password', "Updates the authenticated user's password and revokes other active sessions where supported.")]
    #[BodyParam('current_password', 'string', 'The current account password.', required: true, example: 'current-password')]
    #[BodyParam('password_confirmation', 'string', 'Confirmation matching the new password.', required: true, example: 'correct-horse-battery-staple')]
    #[ScribeResponse(status: 204, description: 'Password updated.')]
    #[ScribeResponse(self::INVALID_PASSWORD_ERROR, status: 400, description: 'The current password is invalid.')]
    public function updatePassword(UpdatePasswordRequest $request, UpdatesUserPasswords $passwords): JsonResponse
    {
        $passwords->update($request->user(), $request->string('password')->toString());

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    #[Endpoint('Update account preferences', 'Saves the authenticated user appearance and language preferences.')]
    #[ScribeResponse(status: 204, description: 'Preferences updated.')]
    public function updatePreferences(Request $request, AppearanceSettings $appearance): JsonResponse
    {
        $languages = explode(',', $appearance->get('enabled_languages') ?? 'en');
        $modes = explode(',', $appearance->get('available_modes') ?? AppearanceSettings::DEFAULTS['available_modes']);
        $data = $request->validate([
            'language' => ['sometimes', 'string', Rule::in($languages)],
            'appearance_mode' => ['sometimes', 'nullable', Rule::in($modes)],
            'sound_preferences' => ['sometimes', 'array:enabled,volume,started,stopped'],
            'sound_preferences.enabled' => ['required_with:sound_preferences', 'boolean'],
            'sound_preferences.volume' => ['required_with:sound_preferences', 'integer', 'between:0,100'],
            'sound_preferences.started' => ['required_with:sound_preferences', Rule::in(['off', 'soft', 'bright'])],
            'sound_preferences.stopped' => ['required_with:sound_preferences', Rule::in(['off', 'soft', 'bright'])],
        ]);
        if (array_key_exists('language', $data) && $appearance->get('allow_language_override') !== '1') {
            throw ValidationException::withMessages(['language' => 'Language selection is disabled by the administrator.']);
        }
        if (array_key_exists('appearance_mode', $data) && $appearance->get('allow_user_override') !== '1') {
            throw ValidationException::withMessages(['appearance_mode' => 'Appearance selection is disabled by the administrator.']);
        }

        $request->user()->fill($data)->save();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
