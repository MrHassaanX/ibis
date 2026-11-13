<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Client\AccountControllerTest;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Pterodactyl\Jobs\RevokeSftpAccessJob;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Appearance\AppearanceSettings;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

uses(ClientApiIntegrationTestCase::class);

test('a user can update their own identity without changing ownership or privileges', function (): void {
    $user = User::factory()->create(['root_admin' => true]);
    $server = $this->createServerModel(['owner_id' => $user->id]);
    $other = User::factory()->create();

    $this->actingAs($user)->putJson('/api/client/account/profile', [
        'first_name' => 'New',
        'last_name' => 'Name',
        'username' => 'Renamed_User',
        'current_password' => 'password',
    ])->assertOk()->assertJsonPath('attributes.username', 'renamed_user')
        ->assertJsonPath('attributes.first_name', 'New');

    $updated = $user->fresh();
    expect($updated->id)->toBe($user->id)
        ->and($updated->uuid)->toBe($user->uuid)
        ->and($updated->root_admin)->toBeTrue()
        ->and($server->fresh()->owner_id)->toBe($user->id)
        ->and($other->fresh()->username)->toBe($other->username);
    $this->getJson('/api/client/account')->assertOk()->assertJsonPath('attributes.username', 'renamed_user');
    $this->assertActivityFor('user:account.profile-updated', $user, $user);
});

test('changing a username requires the current password before uniqueness is checked', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create(['username' => 'already_taken']);
    $payload = ['first_name' => 'First', 'last_name' => 'Last', 'username' => $other->username];

    $this->actingAs($user)->putJson('/api/client/account/profile', $payload)
        ->assertBadRequest()->assertJsonPath('errors.0.code', 'InvalidPasswordProvidedException');
    $this->putJson('/api/client/account/profile', [...$payload, 'current_password' => 'invalid'])
        ->assertBadRequest()->assertJsonPath('errors.0.code', 'InvalidPasswordProvidedException');
    $this->putJson('/api/client/account/profile', [...$payload, 'current_password' => 'password'])
        ->assertUnprocessable()->assertJsonPath('errors.0.meta.rule', 'unique');
    expect($user->fresh()->username)->toBe($user->username);
});

test('profile validation rejects malformed names and usernames without changing the account', function (): void {
    $user = User::factory()->create();
    $base = ['first_name' => 'Valid', 'last_name' => 'Name', 'username' => $user->username];

    $this->actingAs($user)->putJson('/api/client/account/profile', [...$base, 'first_name' => ''])
        ->assertUnprocessable();
    $this->putJson('/api/client/account/profile', [...$base, 'username' => 'bad name', 'current_password' => 'password'])
        ->assertUnprocessable();
    $this->putJson('/api/client/account/profile', [...$base, 'last_name' => str_repeat('x', 192)])
        ->assertUnprocessable();
    expect($user->fresh()->name_first)->toBe($user->name_first)
        ->and($user->fresh()->username)->toBe($user->username);
});

test('sound preferences are private, opt-in and validated', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $preferences = ['enabled' => true, 'volume' => 48, 'started' => 'bright', 'stopped' => 'soft'];

    $this->actingAs($user)->getJson('/api/client/account')->assertOk()
        ->assertJsonPath('attributes.sound_preferences.enabled', false);
    $this->putJson('/api/client/account/preferences', ['sound_preferences' => $preferences])->assertNoContent();
    $this->getJson('/api/client/account')->assertOk()
        ->assertJsonPath('attributes.sound_preferences.volume', 48);
    expect($other->fresh()->sound_preferences)->toBeNull();
    $this->putJson('/api/client/account/preferences', ['sound_preferences' => [...$preferences, 'volume' => 101]])
        ->assertUnprocessable();
    $this->putJson('/api/client/account/preferences', ['sound_preferences' => [...$preferences, 'started' => 'unknown']])
        ->assertUnprocessable();
    expect($user->fresh()->sound_preferences)->toBe($preferences);
});

test('appearance and language preferences persist per user and respect provider controls', function (): void {
    $user = User::factory()->create();
    $settings = app(AppearanceSettings::class);
    $this->actingAs($user)->putJson('/api/client/account/preferences', ['appearance_mode' => 'oled', 'language' => 'hi'])->assertNoContent();
    $this->assertDatabaseHas('users', ['id' => $user->id, 'appearance_mode' => 'oled', 'language' => 'hi']);
    $this->getJson('/api/client/account')->assertOk()->assertJsonPath('attributes.appearance_mode', 'oled')->assertJsonPath('attributes.language', 'hi');
    $this->putJson('/api/client/account/preferences', ['language' => 'fr'])->assertUnprocessable();
    $settings->put('allow_user_override', '0');
    $this->putJson('/api/client/account/preferences', ['appearance_mode' => 'light'])->assertUnprocessable();
    $settings->put('allow_language_override', '0');
    $this->putJson('/api/client/account/preferences', ['language' => 'es'])->assertUnprocessable();
    $this->assertSame('oled', $user->fresh()->appearance_mode);
});
test('account details are returned', function (): void {
    /** @var User $user */
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/api/client/account');
    $response->assertOk()->assertJson(['object' => 'user', 'attributes' => ['id' => $user->id, 'admin' => false, 'username' => $user->username, 'email' => $user->email, 'first_name' => $user->name_first, 'last_name' => $user->name_last, 'language' => $user->language]]);
});
test('email is updated', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user)->putJson('/api/client/account/email', ['email' => $email = Str::random().'@example.com', 'password' => 'password'])->assertNoContent();
    $this->assertActivityFor('user:account.email-changed', $user, $user);
    $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => $email]);
});
test('email change is throttled', function (): void {
    $users = User::factory()->count(2)->create();
    $endpoint = route('api:client.account.update-email');
    for ($i = 0; $i < 3; $i++) {
        $this->actingAs($users[0])->putJson($endpoint, ['email' => "foo+{$i}@example.com", 'password' => 'password'])->assertNoContent();
    }

    $this->putJson($endpoint, ['email' => 'bar@example.com', 'password' => 'password'])->assertTooManyRequests();
    // The other user should still be able to update their email because the throttle
    // is tied to the account, not to the IP address.
    $this->actingAs($users[1])->putJson($endpoint, ['email' => 'bar+1@example.com', 'password' => 'password'])->assertNoContent();
});
test('email is not updated when password is invalid', function (): void {
    /** @var User $user */
    $user = User::factory()->create();
    $response = $this->actingAs($user)->putJson('/api/client/account/email', ['email' => 'hodor@example.com', 'password' => 'invalid']);
    $response->assertStatus(Response::HTTP_BAD_REQUEST);
    $response->assertJsonPath('errors.0.code', 'InvalidPasswordProvidedException');
    $response->assertJsonPath('errors.0.detail', 'The password provided was invalid for this account.');
});
test('email change only reveals that an address is taken to someone with the password', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)->putJson('/api/client/account/email', ['email' => $other->email, 'password' => 'invalid'])
        ->assertStatus(Response::HTTP_BAD_REQUEST)
        ->assertJsonPath('errors.0.code', 'InvalidPasswordProvidedException');

    $this->actingAs($user)->putJson('/api/client/account/email', ['email' => $other->email, 'password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.meta.rule', 'unique');
});
test('email is not updated when not valid', function (): void {
    /** @var User $user */
    $user = User::factory()->create();
    $response = $this->actingAs($user)->putJson('/api/client/account/email', ['email' => '', 'password' => 'password']);
    $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    $response->assertJsonPath('errors.0.meta.rule', 'required');
    $response->assertJsonPath('errors.0.detail', 'The email field is required.');
    $response = $this->actingAs($user)->putJson('/api/client/account/email', ['email' => 'invalid', 'password' => 'password']);
    $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    $response->assertJsonPath('errors.0.meta.rule', 'email');
    $response->assertJsonPath('errors.0.detail', 'The email must be a valid email address.');
});
test('email must be a strict address that does not start with a dash', function (string $email): void {
    $user = User::factory()->create();
    $this->actingAs($user)->putJson('/api/client/account/email', ['email' => $email, 'password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.meta.source_field', 'email');
    $this->assertDatabaseMissing('users', ['id' => $user->id, 'email' => $email]);
})->with([
    'dash prefix' => ['-x@example.com'],
    'local part over 64 characters' => [str_repeat('a', 65).'@example.com'],
    'domain label over 63 characters' => ['user@'.str_repeat('a', 64).'.com'],
]);
test('password is updated', function (): void {
    $user = User::factory()->create();
    // Assign the user to two servers, one as the owner the other as a subuser, both
    // on different nodes to ensure our logic fires off correctly and the user has their
    // credentials revoked on both nodes.
    $server = $this->createServerModel(['owner_id' => $user->id]);
    $server2 = $this->createServerModel();
    Subuser::factory()->for($server2)->for($user)->create();
    $initialHash = $user->password;
    Bus::fake([RevokeSftpAccessJob::class]);
    $this->actingAs($user)->putJson('/api/client/account/password', ['current_password' => 'password', 'password' => 'New_Password1', 'password_confirmation' => 'New_Password1'])->assertNoContent();
    $user = $user->refresh();
    $this->assertNotEquals($user->password, $initialHash);
    expect(Hash::check('New_Password1', $user->password))->toBeTrue();
    expect(Hash::check('password', $user->password))->toBeFalse();
    $this->assertActivityFor('user:account.password-changed', $user, $user);
    $this->assertNotEquals($server->node_id, $server2->node_id);
    Bus::assertDispatchedTimes(RevokeSftpAccessJob::class, 2);
    Bus::assertDispatched(fn (RevokeSftpAccessJob $job): bool => $job->user === $user->uuid && $job->target->is($server->node));
    Bus::assertDispatched(fn (RevokeSftpAccessJob $job): bool => $job->user === $user->uuid && $job->target->is($server2->node));
});
test('password is not updated if current password is invalid', function (): void {
    /** @var User $user */
    $user = User::factory()->create();
    $response = $this->actingAs($user)->putJson('/api/client/account/password', ['current_password' => 'invalid', 'password' => 'New_Password1', 'password_confirmation' => 'New_Password1']);
    $response->assertStatus(Response::HTTP_BAD_REQUEST);
    $response->assertJsonPath('errors.0.code', 'InvalidPasswordProvidedException');
    $response->assertJsonPath('errors.0.detail', 'The password provided was invalid for this account.');
});
test('error is returned for invalid request data', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user)->putJson('/api/client/account/password', ['current_password' => 'password'])->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)->assertJsonPath('errors.0.meta.rule', 'required');
    $this->actingAs($user)->putJson('/api/client/account/password', ['current_password' => 'password', 'password' => 'pass', 'password_confirmation' => 'pass'])->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)->assertJsonPath('errors.0.meta.rule', 'min');
});
test('error is returned if password is not confirmed', function (): void {
    /** @var User $user */
    $user = User::factory()->create();
    $response = $this->actingAs($user)->putJson('/api/client/account/password', ['current_password' => 'password', 'password' => 'New_Password1', 'password_confirmation' => 'Invalid_New_Password']);
    $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
    $response->assertJsonPath('errors.0.meta.rule', 'confirmed');
    $response->assertJsonPath('errors.0.detail', 'The password confirmation does not match.');
});

test('malformed account credentials return 422 without changing the account', function (string $endpoint, string $field, array $credential): void {
    $user = User::factory()->create();
    $originalPassword = $user->password;
    $payload = $endpoint === 'email'
        ? ['email' => 'changed@example.com']
        : ['password' => 'New_Password1', 'password_confirmation' => 'New_Password1'];

    $this->actingAs($user)->putJson('/api/client/account/'.$endpoint, array_merge($payload, $credential))
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.meta.source_field', $field);

    expect($user->fresh()->email)->toBe($user->email);
    expect($user->fresh()->password)->toBe($originalPassword);
})->with([
    'missing email credential' => ['email', 'password', []],
    'null email credential' => ['email', 'password', ['password' => null]],
    'array email credential' => ['email', 'password', ['password' => []]],
    'missing password credential' => ['password', 'current_password', []],
    'null password credential' => ['password', 'current_password', ['current_password' => null]],
    'array password credential' => ['password', 'current_password', ['current_password' => []]],
]);
