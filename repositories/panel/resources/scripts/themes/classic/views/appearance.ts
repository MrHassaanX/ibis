type Appearance = {
    card_layout?: 'compact' | 'premium' | 'banner';
    default_mode?: 'system' | 'oled' | 'light' | 'legacy';
    allow_user_override?: boolean;
    available_modes?: ('system' | 'oled' | 'light' | 'legacy')[];
    navigation_position?: 'left' | 'top';
    roundness?: number;
    storage_unit?: 'decimal' | 'binary';
    default_language?: 'en' | 'hi' | 'es';
    enabled_languages?: ('en' | 'hi' | 'es')[];
    allow_language_override?: boolean;
    language_suggestions?: boolean;
    assets?: Record<string, string | null>;
};

export function panelAppearance(): Appearance {
    const boot = window as Window & { SiteConfiguration?: { appearance?: Appearance } };

    return boot.SiteConfiguration?.appearance ?? {};
}

export type AppearanceMode = 'system' | 'oled' | 'light' | 'legacy';

export function currentAppearanceMode(): AppearanceMode {
    const mode = document.documentElement.dataset.ibisMode;

    return mode === 'system' || mode === 'oled' || mode === 'light' || mode === 'legacy'
        ? mode
        : (panelAppearance().default_mode ?? 'legacy');
}

export function chooseAppearanceMode(
    mode: AppearanceMode,
    setScheme: (mode: 'system' | 'dark' | 'light') => void
): void {
    document.cookie = `ibis_appearance=${mode}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.ibisMode = mode;
    if (mode === 'system') {
        setScheme('system');
    } else {
        setScheme(mode === 'light' ? 'light' : 'dark');
    }
}

export function panelName(): string {
    const boot = window as Window & { SiteConfiguration?: { name?: string } };

    return boot.SiteConfiguration?.name ?? 'IbisPanel';
}
