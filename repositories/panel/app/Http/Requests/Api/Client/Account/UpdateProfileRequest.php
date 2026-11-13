<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Requests\Api\Client\Account;

use Illuminate\Support\Facades\Hash;
use Pterodactyl\Actions\Users\CreateUser;
use Pterodactyl\Exceptions\Http\Base\InvalidPasswordProvidedException;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateProfileRequest extends ClientApiRequest
{
    public function authorize(): bool
    {
        $username = $this->input('username');

        // Check the credential before uniqueness validation to avoid disclosing usernames.
        if (is_string($username) && mb_strtolower($username) !== $this->user()->username) {
            $password = $this->input('current_password');
            throw_if(! is_string($password) || ! Hash::check($password, $this->user()->password), InvalidPasswordProvidedException::class, trans('validation.internal.invalid_password'));
        }

        return parent::authorize();
    }

    /** @return ValidationRules */
    public function rules(): array
    {
        $rules = CreateUser::rules($this->user());

        return [
            'first_name' => $rules['name_first'],
            'last_name' => $rules['name_last'],
            'username' => $rules['username'],
        ];
    }
}
