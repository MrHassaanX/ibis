<!DOCTYPE html>
{{-- The theme's scheme class, id and setting attributes (ThemeDocument::htmlAttributes); values are escaped here. --}}
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @foreach ($theme->htmlAttributes() as $attribute => $value){{ $attribute }}="{{ $value }}" @endforeach>
    <head>
        <title>{{ $siteConfiguration['name'] ?? config('app.name', 'IbisPanel') }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            {{-- An extension that registers one of these elements (registerHeadTags)
                 replaces the panel's default instead of adding a second one. --}}
            @unless ($extensionHead->replaces('link', 'apple-touch-icon'))
                <link rel="apple-touch-icon" href="{{ $appearance['assets']['favicon'] }}">
            @endunless
            @unless ($extensionHead->replaces('link', 'icon'))
                <link rel="icon" href="{{ $appearance['assets']['favicon'] }}">
            @endunless
            @unless ($extensionHead->replaces('link', 'manifest'))
                <link rel="manifest" href="/appearance/manifest.webmanifest">
            @endunless
            @unless ($extensionHead->replaces('link', 'shortcut icon'))
                <link rel="shortcut icon" href="{{ $appearance['assets']['favicon'] }}">
            @endunless
            {{-- data-theme-token: the SPA keeps this tag equal to the --theme-color token.
                 A theme-color registered by an extension is left exactly as rendered. --}}
            @unless ($extensionHead->replaces('meta', 'theme-color'))
                <meta name="theme-color" content="#031426" data-theme-token>
            @endunless
            {{ $extensionHead }}
        @show

        {{-- @json escapes < > & ' " so a stored value such as "<!--<script" cannot
             change how the browser parses these inline scripts. --}}
        @section('user-data')
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = @json(Auth::user()->toVueObject());
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = @json($siteConfiguration);
                </script>
            @endif
        @show

        {{-- The "system" scheme preference is resolved before any stylesheet applies. --}}
        @if ($theme->systemScheme)
            <script>
                (function (root) {
                    var scheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                    root.className = scheme;
                    if (window.SiteConfiguration && window.SiteConfiguration.theme) {
                        window.SiteConfiguration.theme.scheme = scheme;
                    }
                })(document.documentElement);
            </script>
        @endif

        {{-- Setting tokens, escaped by their settings (ThemeSetting::tokenValue), so they print as is. --}}
        <style id="theme-settings">{!! $theme->style() !!}</style>
        <style id="ibis-appearance">:root:root{--ibis-accent:{{ $appearance['accent'] }};--ibis-roundness:{{ $appearance['roundness'] / 100 }};--ibis-login-background:{{ $appearance['assets']['login_background'] ? 'url('.$appearance['assets']['login_background'].')' : 'none' }};}</style>

        @yield('assets')
        {!! $asset->css($asset::STYLESHEET_ENTRY) !!}
        @if ($theme->stylesheet !== null)
            <link rel="stylesheet" href="{{ $theme->stylesheet }}">
        @endif
        {!! $asset->cssImports('resources/scripts/index.tsx') !!}

        {{-- The import map must precede any module script: it lets runtime-loaded
             extension and theme bundles share the panel's React/TanStack/SDK module instances. --}}
        {!! $asset->importMap() !!}
        @foreach ($theme->modulePreloads() as $entry)
            <link rel="modulepreload" href="{{ $entry }}">
        @endforeach
    </head>
    <body class="{{ $css['body'] ?? 'bg-background' }}" data-ibis-card-layout="{{ $appearance['card_layout'] }}" data-ibis-glass="{{ $appearance['glass'] ? 'on' : 'off' }}" data-ibis-nav="{{ $appearance['navigation_position'] }}">
        @section('content')
            <div id="ibis-boot-loader" role="status" aria-label="Loading IbisPanel">
                @if (!empty($siteConfiguration['loader']['url']))
                    <img class="ibis-loader-custom" src="{{ $siteConfiguration['loader']['url'] }}" alt="">
                @else
                    <img class="ibis-loader-default" src="/brand/ibis-icon-192.png" alt="">
                @endif
                <span>Loading IbisPanel…</span>
            </div>
            <style>
                #ibis-boot-loader { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; background: #031426; color: #c7d5e3; font: 500 1rem system-ui, sans-serif; }
                #ibis-boot-loader img { max-width: min(160px, 45vw); max-height: 160px; object-fit: contain; }
                #ibis-boot-loader .ibis-loader-default { animation: ibis-breathe 1.6s ease-in-out infinite alternate; }
                @keyframes ibis-breathe { to { opacity: .45; transform: scale(.94); } }
                @media (prefers-reduced-motion: reduce) { #ibis-boot-loader .ibis-loader-default { animation: none; } #ibis-boot-loader .ibis-loader-custom { display: none; } }
            </style>
            <script>setTimeout(function () { document.getElementById('ibis-boot-loader')?.remove(); }, 8000);</script>
            @yield('above-container')
            @yield('container')
            @yield('below-container')
        @show
        @section('scripts')
            {!! $asset->js('resources/scripts/index.tsx') !!}
        @show
    </body>
</html>
