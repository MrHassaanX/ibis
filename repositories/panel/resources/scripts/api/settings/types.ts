export interface SiteSettings {
    name: string;
    locale: string;
    appearance?: {
        accent: string;
        default_mode: 'system' | 'oled' | 'light' | 'legacy';
        allow_user_override: boolean;
        available_modes: ('system' | 'oled' | 'light' | 'legacy')[];
        navigation_position: 'left' | 'top';
        roundness: number;
        storage_unit: 'decimal' | 'binary';
        default_language: 'en' | 'hi' | 'es';
        enabled_languages: ('en' | 'hi' | 'es')[];
        allow_language_override: boolean;
        language_suggestions: boolean;
        card_layout: 'compact' | 'premium' | 'banner';
        glass: boolean;
        banners_enabled: boolean;
        assets: Record<
            | 'login_logo'
            | 'login_logo_light'
            | 'nav_logo'
            | 'nav_logo_light'
            | 'favicon'
            | 'login_background'
            | 'global_banner',
            string | null
        >;
    };
    recaptcha: {
        enabled: boolean;
        siteKey: string;
    };
}
