<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Appearance\AppearanceSettings;
use Symfony\Component\HttpFoundation\Response;

class LanguageMiddleware
{
    /**
     * LanguageMiddleware constructor.
     */
    public function __construct(private readonly Application $app, private readonly AppearanceSettings $appearance) {}

    /**
     * Handle an incoming request and set the user's preferred language.
     */
    /**
     * @param  Closure(Request):Response  $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();
        $enabled = explode(',', $this->appearance->get('enabled_languages') ?? AppearanceSettings::DEFAULTS['enabled_languages']);
        $default = $this->appearance->get('default_language') ?? 'en';
        $locale = $user instanceof User ? $user->language : ($this->appearance->get('allow_language_override') === '1' ? $request->cookie('ibis_language') : null);
        $this->app->setLocale(in_array($locale, $enabled, true) ? $locale : $default);

        return $next($request);
    }
}
