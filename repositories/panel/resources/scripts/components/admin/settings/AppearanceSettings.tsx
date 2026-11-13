import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Cpu, HardDrive, ImageUp, MemoryStick, Server } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ListRow, PanelLink, Stat } from '@/sdk';
import http, { httpErrorToHuman, httpValidationErrors } from '@/api/http';
import { useNavigationBlocker } from '@/plugins/useNavigationBlocker';

type Slot =
    | 'login_logo'
    | 'login_logo_light'
    | 'nav_logo'
    | 'nav_logo_light'
    | 'favicon'
    | 'login_background'
    | 'global_banner';
type Appearance = {
    company_name: string;
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
    assets: Record<Slot, string | null>;
    egg_banners: Record<string, string | null>;
    server_banners: Record<string, string | null>;
    egg_icons: Record<string, string | null>;
    server_icons: Record<string, string | null>;
};
type Draft = Pick<
    Appearance,
    | 'company_name'
    | 'accent'
    | 'default_mode'
    | 'allow_user_override'
    | 'available_modes'
    | 'navigation_position'
    | 'roundness'
    | 'storage_unit'
    | 'default_language'
    | 'enabled_languages'
    | 'allow_language_override'
    | 'language_suggestions'
    | 'card_layout'
    | 'glass'
    | 'banners_enabled'
>;
const draftFrom = (data: Appearance): Draft => ({
    company_name: data.company_name,
    accent: data.accent,
    default_mode: data.default_mode,
    allow_user_override: data.allow_user_override,
    available_modes: data.available_modes,
    navigation_position: data.navigation_position,
    roundness: data.roundness,
    storage_unit: data.storage_unit,
    default_language: data.default_language,
    enabled_languages: data.enabled_languages,
    allow_language_override: data.allow_language_override,
    language_suggestions: data.language_suggestions,
    card_layout: data.card_layout,
    glass: data.glass,
    banners_enabled: data.banners_enabled,
});
const assetLabels = {
    login_logo: 'Login logo',
    login_logo_light: 'Login logo for light mode',
    nav_logo: 'Navigation logo or icon',
    nav_logo_light: 'Navigation logo for light mode',
    favicon: 'Browser and app icon',
    login_background: 'Login background',
    global_banner: 'Global server banner',
} satisfies Record<Slot, string>;
const defaultAssets = {
    login_logo: '/brand/ibis-stacked.png',
    login_logo_light: '/brand/ibis-stacked.png',
    nav_logo: '/brand/ibis-icon-192.png',
    nav_logo_light: '/brand/ibis-icon-192.png',
    favicon: '/brand/ibis-icon-32.png',
    login_background: null,
    global_banner: null,
} satisfies Record<Slot, string | null>;
const base = '/api/admin/settings/appearance';
const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const secondaryButton = 'rounded-md border border-border px-3 py-2 text-sm hover:bg-popover disabled:opacity-50';

function ImageChooser({
    label,
    filename,
    disabled,
    onSelect,
}: {
    label: string;
    filename: string | null;
    disabled: boolean;
    onSelect: (file: File | null) => void;
}) {
    return (
        <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50'>
            <ImageUp size={18} className='shrink-0 text-primary' aria-hidden />
            <span className='min-w-0'>
                <span className='block font-medium text-foreground'>Choose image</span>
                <span
                    className='block truncate text-xs text-muted-foreground'
                    title={filename ?? 'PNG, JPEG or WebP · up to 4 MB'}
                >
                    {filename ?? 'PNG, JPEG or WebP · up to 4 MB'}
                </span>
            </span>
            <input
                type='file'
                accept='image/png,image/jpeg,image/webp'
                aria-label={label}
                disabled={disabled}
                className='sr-only'
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    onSelect(event.target.files?.[0] ?? null);
                    event.target.value = '';
                }}
            />
        </label>
    );
}

// The editor coordinates independent image and scalar settings sections.
// oxlint-disable-next-line eslint/complexity
export default function AppearanceSettings({ readOnly }: { readOnly: boolean }) {
    const { data, error, refetch } = useQuery({
        queryKey: ['admin', 'appearance'],
        queryFn: () => http.get<Appearance>(base).then((response) => response.data),
    });
    const [draft, setDraft] = useState<Draft | null>(null);
    const [busy, setBusy] = useState(false);
    const [targetType, setTargetType] = useState<'egg_banner' | 'server_banner' | 'egg_icon' | 'server_icon'>(
        'egg_banner'
    );
    const [targetId, setTargetId] = useState('');
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [targetFileUrl, setTargetFileUrl] = useState<string | null>(null);
    const [pendingImages, setPendingImages] = useState<Record<string, File | null>>({});
    const [pendingUrls, setPendingUrls] = useState<Record<string, string>>({});
    const [previewPage, setPreviewPage] = useState<'dashboard' | 'server' | 'console' | 'admin' | 'login'>('dashboard');
    const [systemLight, setSystemLight] = useState(
        () => window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false
    );
    const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [previewExpanded, setPreviewExpanded] = useState(false);
    const [editorSection, setEditorSection] = useState<
        'appearance' | 'branding' | 'layout' | 'components' | 'banners' | 'advanced'
    >('appearance');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const saved = useRef(false);

    useEffect(() => {
        if (data) {
            setDraft(draftFrom(data));
        }
    }, [data]);
    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: light)');

        if (!media) {
            return;
        }

        const changed = () => setSystemLight(media.matches);

        media.addEventListener('change', changed);

        return () => media.removeEventListener('change', changed);
    }, []);
    useEffect(() => {
        const readers: FileReader[] = [];

        setPendingUrls({});
        for (const [key, file] of Object.entries(pendingImages)) {
            if (!(file instanceof File)) {
                continue;
            }

            const reader = new FileReader();

            reader.addEventListener('load', () => {
                setPendingUrls((current) => ({ ...current, [key]: reader.result as string }));
            });
            reader.readAsDataURL(file);
            readers.push(reader);
        }

        return () => {
            for (const reader of readers) {
                if (reader.readyState === FileReader.LOADING) {
                    reader.abort();
                }
            }
        };
    }, [pendingImages]);
    useEffect(() => {
        if (!targetFile) {
            setTargetFileUrl(null);

            return;
        }

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            setTargetFileUrl(reader.result as string);
        });
        reader.readAsDataURL(targetFile);

        return () => {
            if (reader.readyState === FileReader.LOADING) {
                reader.abort();
            }
        };
    }, [targetFile]);
    useEffect(() => {
        if (!previewExpanded) {
            return;
        }

        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setPreviewExpanded(false);
            }
        };

        window.addEventListener('keydown', close);

        return () => window.removeEventListener('keydown', close);
    }, [previewExpanded]);
    const dirty =
        !!draft &&
        !!data &&
        (JSON.stringify(draft) !== JSON.stringify(draftFrom(data)) || Object.keys(pendingImages).length > 0);

    useNavigationBlocker(() => dirty && !saved.current);
    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
        setDraft((current) => current && { ...current, [key]: value });
        setValidationErrors((current) => ({ ...current, [key]: '' }));
    };

    const changed = async (action: () => Promise<unknown>, success: string, reload = false) => {
        setBusy(true);
        try {
            await action();
            await refetch();
            toast.success(success);

            if (reload) {
                saved.current = true;
                window.location.reload();
            }
        } catch (cause) {
            setValidationErrors(httpValidationErrors(cause));
            toast.error(httpErrorToHuman(cause));
        } finally {
            setBusy(false);
        }
    };

    const save = () =>
        draft &&
        changed(
            async () => {
                await http.put(base, draft);
                for (const [key, file] of Object.entries(pendingImages)) {
                    const [slot, targetId] = key.split(':');

                    if (file) {
                        const body = new FormData();

                        body.set('slot', slot ?? '');
                        body.set('image', file);
                        if (targetId) {
                            body.set('target_id', targetId);
                        }

                        // oxlint-disable-next-line no-await-in-loop -- selected images have independent targets.
                        await http.post(`${base}/image`, body);
                    } else {
                        // oxlint-disable-next-line no-await-in-loop -- reset one selected image at a time.
                        await http.delete(`${base}/image`, {
                            data: { slot, target_id: targetId ? Number(targetId) : undefined },
                        });
                    }
                }

                setPendingImages({});
            },
            'Appearance saved',
            true
        );

    const upload = (
        slot: Slot | 'egg_banner' | 'server_banner' | 'egg_icon' | 'server_icon',
        image: File,
        id?: number
    ) => {
        const limit = slot.endsWith('_icon') ? 512 * 1024 : 4 * 1024 * 1024;

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(image.type) || image.size > limit) {
            toast.error(`Choose a PNG, JPEG or WebP image under ${slot.endsWith('_icon') ? '512 KB' : '4 MB'}.`);

            return;
        }

        setPendingImages((current) => ({ ...current, [`${slot}:${id ?? ''}`]: image }));
    };

    const clear = (slot: Slot | 'egg_banner' | 'server_banner' | 'egg_icon' | 'server_icon', id?: number) =>
        setPendingImages((current) => ({ ...current, [`${slot}:${id ?? ''}`]: null }));
    const stagedUrl = (slot: Slot, current: string | null): string | null => {
        const key = `${slot}:`;

        if (!(key in pendingImages)) {
            return current;
        }

        return pendingImages[key] ? (pendingUrls[key] ?? current) : defaultAssets[slot];
    };

    const imageInput = (slot: Slot, url: string | null) => (
        <div key={slot} className='rounded-lg border border-border p-4'>
            <h3 className='font-medium'>{assetLabels[slot]}</h3>
            <div className='my-3 flex h-24 items-center justify-center overflow-hidden rounded-md border border-border bg-background'>
                {stagedUrl(slot, url) ? (
                    <img
                        src={stagedUrl(slot, url) ?? undefined}
                        alt={`${assetLabels[slot]} preview`}
                        className='max-h-full max-w-full object-contain'
                    />
                ) : (
                    <span className='text-sm text-muted-foreground'>Default surface</span>
                )}
            </div>
            <div className='flex flex-wrap gap-2'>
                <ImageChooser
                    label={`Upload ${assetLabels[slot]}`}
                    disabled={busy}
                    filename={
                        pendingImages[`${slot}:`]?.name ??
                        (pendingImages[`${slot}:`] === null ? 'Reset to default on save' : null)
                    }
                    onSelect={(file) => file && upload(slot, file)}
                />
                <button type='button' className={secondaryButton} disabled={busy} onClick={() => clear(slot)}>
                    Reset
                </button>
            </div>
        </div>
    );

    if (error) {
        return (
            <p role='alert' className='text-destructive'>
                {httpErrorToHuman(error)}
            </p>
        );
    }

    if (!data || !draft) {
        return <p role='status'>Loading appearance settings…</p>;
    }

    const targetKey = `${targetType}:${targetId}`;
    let targetUrl = {
        egg_banner: data.egg_banners,
        server_banner: data.server_banners,
        egg_icon: data.egg_icons,
        server_icon: data.server_icons,
    }[targetType][targetId];

    if (targetKey in pendingImages) {
        targetUrl = pendingImages[targetKey] ? pendingUrls[targetKey] : null;
    }

    const previewBanner = stagedUrl('global_banner', data.assets.global_banner);
    let previewMode = draft.default_mode;

    if (previewMode === 'system') {
        previewMode = systemLight ? 'light' : 'oled';
    }

    const previewWidth = { desktop: previewExpanded ? 1000 : undefined, tablet: 768, mobile: 390 }[previewViewport];
    const previewTitle = {
        dashboard: 'Dashboard',
        server: 'Server overview',
        console: 'Server console',
        admin: 'Administration',
        login: 'Login to continue',
    }[previewPage];

    return (
        <div className='ibis-editor-layout grid items-start gap-7 xl:grid-cols-[minmax(0,1.05fr)_minmax(440px,1fr)]'>
            <fieldset disabled={readOnly} className='min-w-0 space-y-7 text-foreground'>
                <div className='ibis-editor-sections flex flex-wrap gap-2' aria-label='Appearance editor sections'>
                    {(['appearance', 'branding', 'layout', 'components', 'banners', 'advanced'] as const).map(
                        (section) => (
                            <button
                                key={section}
                                type='button'
                                aria-pressed={editorSection === section}
                                className={`${secondaryButton} ibis-editor-tab capitalize aria-pressed:border-primary aria-pressed:bg-popover`}
                                onClick={() => setEditorSection(section)}
                            >
                                {section}
                            </button>
                        )
                    )}
                </div>
                <section
                    hidden={!['appearance', 'layout', 'components', 'advanced'].includes(editorSection)}
                    className='ibis-editor-controls rounded-lg border border-border bg-card p-5'
                >
                    <h2 className='text-xl font-semibold'>
                        {
                            {
                                appearance: 'Identity and theme',
                                branding: '',
                                layout: 'Layout',
                                components: 'Components',
                                banners: '',
                                advanced: 'Advanced preferences',
                            }[editorSection]
                        }
                    </h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        Changes are stored by the panel and appear after saving, without rebuilding assets. Theme
                        packages are managed separately in{' '}
                        <PanelLink destination={{ to: '/panel/themes' }} className='text-primary underline'>
                            Themes
                        </PanelLink>
                        .
                    </p>
                    <div className='mt-5 grid gap-5 md:grid-cols-2'>
                        {editorSection === 'appearance' && (
                            <>
                                <label className='block text-sm'>
                                    Company name
                                    <input
                                        className={`${inputClass} mt-2`}
                                        value={draft.company_name}
                                        aria-invalid={!!validationErrors.company_name}
                                        maxLength={100}
                                        disabled={readOnly || busy}
                                        onChange={(event) => set('company_name', event.target.value)}
                                    />
                                    {validationErrors.company_name && (
                                        <span role='alert' className='text-destructive'>
                                            {validationErrors.company_name}
                                        </span>
                                    )}
                                </label>
                                <label className='block text-sm'>
                                    Accent color
                                    <span className='mt-2 flex gap-2'>
                                        <input
                                            type='color'
                                            aria-label='Accent color picker'
                                            value={draft.accent}
                                            onChange={(event) => set('accent', event.target.value)}
                                            className='h-10 w-14'
                                        />
                                        <input
                                            className={inputClass}
                                            value={draft.accent}
                                            aria-invalid={!!validationErrors.accent}
                                            onChange={(event) => set('accent', event.target.value)}
                                        />
                                    </span>
                                    {validationErrors.accent && (
                                        <span role='alert' className='text-destructive'>
                                            {validationErrors.accent}
                                        </span>
                                    )}
                                </label>
                                <div className='block text-sm md:col-span-2'>
                                    <p>Default appearance</p>
                                    <span
                                        className='ibis-editor-modes mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4'
                                        role='group'
                                        aria-label='Default appearance'
                                    >
                                        {(['system', 'oled', 'light', 'legacy'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                type='button'
                                                aria-pressed={draft.default_mode === mode}
                                                className='ibis-mode-option rounded-md border border-border text-left aria-pressed:border-primary'
                                                data-mode={mode}
                                                onClick={() =>
                                                    setDraft(
                                                        (current) =>
                                                            current && {
                                                                ...current,
                                                                default_mode: mode,
                                                                available_modes: current.available_modes.includes(mode)
                                                                    ? current.available_modes
                                                                    : [...current.available_modes, mode],
                                                            }
                                                    )
                                                }
                                            >
                                                <span className='ibis-mode-thumbnail' aria-hidden='true' />
                                                <strong className='block text-xs'>
                                                    {
                                                        {
                                                            system: 'System',
                                                            oled: 'Dark OLED',
                                                            light: 'Light',
                                                            legacy: 'Ibis Legacy',
                                                        }[mode]
                                                    }
                                                </strong>
                                            </button>
                                        ))}
                                    </span>
                                </div>
                            </>
                        )}
                        {editorSection === 'layout' && (
                            <>
                                <label className='block text-sm'>
                                    Server card layout
                                    <select
                                        className={`${inputClass} mt-2`}
                                        value={draft.card_layout}
                                        onChange={(event) =>
                                            set('card_layout', event.target.value as Draft['card_layout'])
                                        }
                                    >
                                        <option value='compact'>Compact</option>
                                        <option value='premium'>Premium</option>
                                        <option value='banner'>Banner</option>
                                    </select>
                                </label>
                                <div className='block text-sm md:col-span-2'>
                                    <p>Navigation position</p>
                                    <span
                                        className='ibis-editor-segmented mt-2 flex flex-wrap gap-2'
                                        role='group'
                                        aria-label='Navigation position'
                                    >
                                        {(['left', 'top'] as const).map((position) => (
                                            <button
                                                key={position}
                                                type='button'
                                                aria-pressed={draft.navigation_position === position}
                                                className={`${secondaryButton} aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground`}
                                                onClick={() => set('navigation_position', position)}
                                            >
                                                {position === 'left' ? 'Left sidebar' : 'Top navigation'}
                                            </button>
                                        ))}
                                    </span>
                                </div>
                            </>
                        )}
                        {editorSection === 'components' && (
                            <div className='block text-sm md:col-span-2'>
                                <p>Storage unit</p>
                                <span
                                    className='ibis-editor-segmented mt-2 flex flex-wrap gap-2'
                                    role='group'
                                    aria-label='Storage unit'
                                >
                                    {(['decimal', 'binary'] as const).map((unit) => (
                                        <button
                                            key={unit}
                                            type='button'
                                            aria-pressed={draft.storage_unit === unit}
                                            className={`${secondaryButton} aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground`}
                                            onClick={() => set('storage_unit', unit)}
                                        >
                                            {unit === 'decimal' ? 'Decimal (MB/GB)' : 'Binary (MiB/GiB)'}
                                        </button>
                                    ))}
                                </span>
                            </div>
                        )}
                        {editorSection === 'layout' && (
                            <label className='block text-sm md:col-span-2'>
                                Corner roundness: <output>{draft.roundness}%</output>
                                <input
                                    type='range'
                                    min='0'
                                    max='100'
                                    step='1'
                                    value={draft.roundness}
                                    onChange={(event) => set('roundness', Number(event.target.value))}
                                    className='mt-3 w-full accent-primary'
                                />
                            </label>
                        )}
                        {editorSection === 'advanced' && (
                            <label className='block text-sm'>
                                Default language
                                <select
                                    className={`${inputClass} mt-2`}
                                    value={draft.default_language}
                                    onChange={(event) => {
                                        const language = event.target.value as Draft['default_language'];

                                        setDraft(
                                            (current) =>
                                                current && {
                                                    ...current,
                                                    default_language: language,
                                                    enabled_languages: current.enabled_languages.includes(language)
                                                        ? current.enabled_languages
                                                        : [...current.enabled_languages, language],
                                                }
                                        );
                                    }}
                                >
                                    <option value='en'>English</option>
                                    <option value='hi'>हिन्दी</option>
                                    <option value='es'>Español</option>
                                </select>
                            </label>
                        )}
                    </div>
                    {(editorSection === 'advanced' || editorSection === 'components') && (
                        <div className='mt-5 flex flex-wrap gap-6 text-sm'>
                            {editorSection === 'advanced' && (
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={draft.allow_user_override}
                                        onChange={(event) => set('allow_user_override', event.target.checked)}
                                    />
                                    Allow users to choose an appearance
                                </label>
                            )}
                            {editorSection === 'components' && (
                                <>
                                    <label className='flex items-center gap-2'>
                                        <input
                                            type='checkbox'
                                            checked={draft.glass}
                                            onChange={(event) => set('glass', event.target.checked)}
                                        />{' '}
                                        Glass surfaces on server cards
                                    </label>
                                    <label className='flex items-center gap-2'>
                                        <input
                                            type='checkbox'
                                            checked={draft.banners_enabled}
                                            onChange={(event) => set('banners_enabled', event.target.checked)}
                                        />{' '}
                                        Show server banners
                                    </label>
                                </>
                            )}
                        </div>
                    )}
                    {editorSection === 'advanced' && (
                        <>
                            <div className='mt-5'>
                                <p className='mb-2 text-sm font-medium'>Available appearances</p>
                                <div className='flex flex-wrap gap-3 text-sm'>
                                    {(['system', 'oled', 'light', 'legacy'] as const).map((mode) => (
                                        <label key={mode} className='flex items-center gap-2'>
                                            <input
                                                type='checkbox'
                                                checked={draft.available_modes.includes(mode)}
                                                disabled={mode === draft.default_mode}
                                                onChange={(event) =>
                                                    set(
                                                        'available_modes',
                                                        event.target.checked
                                                            ? [...draft.available_modes, mode]
                                                            : draft.available_modes.filter((value) => value !== mode)
                                                    )
                                                }
                                            />
                                            {
                                                {
                                                    system: 'System',
                                                    oled: 'Dark OLED',
                                                    light: 'Light',
                                                    legacy: 'Ibis Legacy',
                                                }[mode]
                                            }
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className='mt-5 space-y-3 text-sm'>
                                <p className='font-medium'>Languages</p>
                                <div className='flex flex-wrap gap-3'>
                                    {(['en', 'hi', 'es'] as const).map((language) => (
                                        <label key={language} className='flex items-center gap-2'>
                                            <input
                                                type='checkbox'
                                                checked={draft.enabled_languages.includes(language)}
                                                disabled={language === draft.default_language}
                                                onChange={(event) =>
                                                    set(
                                                        'enabled_languages',
                                                        event.target.checked
                                                            ? [...draft.enabled_languages, language]
                                                            : draft.enabled_languages.filter(
                                                                  (value) => value !== language
                                                              )
                                                    )
                                                }
                                            />
                                            {{ en: 'English', hi: 'हिन्दी', es: 'Español' }[language]}
                                        </label>
                                    ))}
                                </div>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={draft.allow_language_override}
                                        onChange={(event) => set('allow_language_override', event.target.checked)}
                                    />
                                    Allow users to choose a language
                                </label>
                                <label className='flex items-center gap-2'>
                                    <input
                                        type='checkbox'
                                        checked={draft.language_suggestions}
                                        onChange={(event) => set('language_suggestions', event.target.checked)}
                                    />
                                    Suggest an available browser language without changing it automatically
                                </label>
                            </div>
                        </>
                    )}
                </section>
                <section hidden={editorSection !== 'branding'} className='rounded-lg border border-border bg-card p-5'>
                    <h2 className='text-xl font-semibold'>Brand images</h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        PNG, JPEG or WebP. Maximum 4 MB and 3200 × 1800 pixels. Login and navigation assets are
                        independent.
                    </p>
                    <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                        {(Object.keys(assetLabels) as Slot[]).map((slot) => imageInput(slot, data.assets[slot]))}
                    </div>
                </section>
                <section hidden={editorSection !== 'banners'} className='rounded-lg border border-border bg-card p-5'>
                    <h2 className='text-xl font-semibold'>Egg and server artwork</h2>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        Server artwork overrides its Egg artwork. Otherwise, the workload artwork is used; unknown
                        workloads use the global or generic banner.
                    </p>
                    <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                        <label className='text-sm'>
                            Artwork scope
                            <select
                                className={`${inputClass} mt-2`}
                                value={targetType}
                                onChange={(event) => {
                                    setTargetType(event.target.value as typeof targetType);
                                    setTargetFile(null);
                                }}
                            >
                                <option value='egg_banner'>Egg default</option>
                                <option value='server_banner'>Individual server</option>
                                <option value='egg_icon'>Egg icon</option>
                                <option value='server_icon'>Individual server icon</option>
                            </select>
                        </label>
                        <label className='text-sm'>
                            Existing {targetType.startsWith('egg_') ? 'Egg' : 'server'} ID
                            <input
                                className={`${inputClass} mt-2`}
                                type='number'
                                min='1'
                                value={targetId}
                                onChange={(event) => {
                                    setTargetId(event.target.value);
                                    setTargetFile(null);
                                }}
                            />
                        </label>
                    </div>
                    {(targetFileUrl || targetUrl) && (
                        <img
                            src={targetFileUrl || targetUrl || undefined}
                            alt='Current artwork preview'
                            className={`mt-4 rounded-md ${targetType.endsWith('_icon') ? 'h-24 w-24 object-contain' : 'h-32 w-full object-cover'}`}
                        />
                    )}
                    <div className='mt-4 flex flex-wrap gap-3'>
                        <ImageChooser
                            label='Egg or server artwork image'
                            filename={targetFile?.name ?? null}
                            disabled={busy}
                            onSelect={setTargetFile}
                        />
                        <button
                            type='button'
                            className={secondaryButton}
                            disabled={
                                busy || !targetFile || !Number.isInteger(Number(targetId)) || Number(targetId) < 1
                            }
                            onClick={() => {
                                if (targetFile) {
                                    upload(targetType, targetFile, Number(targetId));
                                    setTargetFile(null);
                                }
                            }}
                        >
                            Stage artwork
                        </button>
                        <button
                            type='button'
                            className={secondaryButton}
                            disabled={busy || !targetUrl}
                            onClick={() => clear(targetType, Number(targetId))}
                        >
                            Reset artwork
                        </button>
                    </div>
                </section>
                <div className='flex flex-wrap justify-end gap-2'>
                    <button
                        type='button'
                        className={secondaryButton}
                        disabled={!dirty || busy}
                        onClick={() => {
                            setDraft(draftFrom(data));
                            setPendingImages({});
                            setTargetFile(null);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        className={secondaryButton}
                        disabled={busy}
                        onClick={() => {
                            if (editorSection === 'appearance') {
                                setDraft(
                                    (current) =>
                                        current && {
                                            ...current,
                                            company_name: data.company_name,
                                            accent: data.accent,
                                            default_mode: data.default_mode,
                                        }
                                );
                            } else if (editorSection === 'layout') {
                                setDraft(
                                    (current) =>
                                        current && {
                                            ...current,
                                            card_layout: data.card_layout,
                                            navigation_position: data.navigation_position,
                                            roundness: data.roundness,
                                        }
                                );
                            } else if (editorSection === 'components') {
                                setDraft(
                                    (current) =>
                                        current && {
                                            ...current,
                                            storage_unit: data.storage_unit,
                                            glass: data.glass,
                                            banners_enabled: data.banners_enabled,
                                        }
                                );
                            } else if (editorSection === 'advanced') {
                                setDraft(
                                    (current) =>
                                        current && {
                                            ...current,
                                            allow_user_override: data.allow_user_override,
                                            available_modes: data.available_modes,
                                            default_language: data.default_language,
                                            enabled_languages: data.enabled_languages,
                                            allow_language_override: data.allow_language_override,
                                            language_suggestions: data.language_suggestions,
                                        }
                                );
                            } else {
                                setPendingImages((current) =>
                                    Object.fromEntries(
                                        Object.entries(current).filter(([key]) =>
                                            editorSection === 'branding'
                                                ? ['egg_banner:', 'server_banner:', 'egg_icon:', 'server_icon:'].some(
                                                      (prefix) => key.startsWith(prefix)
                                                  )
                                                : !key.startsWith('egg_banner:') &&
                                                  !key.startsWith('server_banner:') &&
                                                  !key.startsWith('egg_icon:') &&
                                                  !key.startsWith('server_icon:') &&
                                                  key !== 'global_banner:'
                                        )
                                    )
                                );
                                if (editorSection === 'banners') {
                                    setTargetFile(null);
                                }
                            }
                        }}
                    >
                        Reset current section
                    </button>
                    <button
                        type='button'
                        className={secondaryButton}
                        disabled={busy}
                        onClick={() =>
                            setDraft(
                                (current) =>
                                    current && {
                                        ...current,
                                        // oxlint-disable-next-line rules/design-tokens -- official IbisPanel reset value.
                                        accent: '#00e5ec',
                                        default_mode: 'legacy',
                                        allow_user_override: true,
                                        available_modes: ['system', 'oled', 'light', 'legacy'],
                                        navigation_position: 'left',
                                        roundness: 35,
                                        storage_unit: 'binary',
                                        default_language: 'en',
                                        enabled_languages: ['en', 'hi', 'es'],
                                        allow_language_override: true,
                                        language_suggestions: false,
                                        card_layout: 'premium',
                                        glass: false,
                                        banners_enabled: true,
                                    }
                            )
                        }
                    >
                        Restore defaults in preview
                    </button>
                    <button
                        type='button'
                        className='rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50'
                        disabled={
                            !dirty || busy || !/^#[0-9a-fA-F]{6}$/.test(draft.accent) || !draft.company_name.trim()
                        }
                        onClick={save}
                    >
                        Save changes
                    </button>
                </div>
            </fieldset>
            {previewExpanded && (
                <button
                    type='button'
                    className='fixed inset-0 z-[59] cursor-default bg-foreground/70'
                    aria-label='Close full preview'
                    onClick={() => setPreviewExpanded(false)}
                />
            )}
            <aside
                className={`min-w-0 xl:sticky xl:top-5 ${previewExpanded ? 'fixed inset-[3vh] z-[60] overflow-auto rounded-xl border border-border bg-background p-5 shadow-2xl xl:top-[3vh]' : ''}`}
                aria-label='Live appearance preview'
                role={previewExpanded ? 'dialog' : undefined}
                aria-modal={previewExpanded || undefined}
            >
                <div className='mb-3 flex flex-wrap items-center gap-2'>
                    <h2 className='mr-auto text-lg font-semibold'>Live preview</h2>
                    <button
                        type='button'
                        className={secondaryButton}
                        onClick={() => setPreviewExpanded((value) => !value)}
                    >
                        {previewExpanded ? 'Close full preview' : 'Open full preview'}
                    </button>
                    {dirty && (
                        <span role='status' className='text-xs text-warning'>
                            Unsaved changes
                        </span>
                    )}
                </div>
                <div className='mb-3 flex flex-wrap gap-2' aria-label='Preview page'>
                    {(['dashboard', 'server', 'console', 'admin', 'login'] as const).map((page) => (
                        <button
                            key={page}
                            type='button'
                            aria-pressed={previewPage === page}
                            onClick={() => setPreviewPage(page)}
                            className={`${secondaryButton} capitalize aria-pressed:border-primary`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <div className='mb-3 flex flex-wrap gap-2' aria-label='Preview viewport'>
                    {(['desktop', 'tablet', 'mobile'] as const).map((viewport) => (
                        <button
                            key={viewport}
                            type='button'
                            aria-pressed={previewViewport === viewport}
                            onClick={() => setPreviewViewport(viewport)}
                            className={`${secondaryButton} capitalize aria-pressed:border-primary`}
                        >
                            {viewport}
                        </button>
                    ))}
                </div>
                <div className='flex justify-center overflow-auto rounded-xl border border-border bg-muted p-3'>
                    <div
                        className='ibis-appearance-preview w-full overflow-hidden border border-border shadow-lg transition-[width] duration-200'
                        data-preview-mode={previewMode}
                        data-preview-viewport={previewViewport}
                        data-preview-glass={draft.glass ? 'on' : 'off'}
                        style={{
                            maxWidth: previewWidth,
                            borderRadius: `${draft.roundness * 0.24}px`,
                            ['--preview-accent' as string]: draft.accent,
                        }}
                    >
                        <div
                            className={`ibis-preview-shell ${draft.navigation_position === 'left' && previewPage !== 'login' ? 'ibis-preview-left' : ''}`}
                        >
                            {draft.navigation_position === 'left' && previewPage !== 'login' && (
                                <nav aria-label='Preview navigation' className='ibis-preview-sidebar'>
                                    <img
                                        src={stagedUrl('nav_logo', data.assets.nav_logo) ?? '/brand/ibis-icon-192.png'}
                                        alt=''
                                    />
                                    <strong>{draft.company_name}</strong>
                                    <span>Dashboard</span>
                                    <span>Servers</span>
                                    <span>Account</span>
                                </nav>
                            )}
                            <div className='min-w-0 flex-1'>
                                {(draft.navigation_position === 'top' || previewPage === 'login') && (
                                    <header className='ibis-preview-header'>
                                        <img
                                            src={
                                                previewPage === 'login'
                                                    ? (stagedUrl('login_logo', data.assets.login_logo) ??
                                                      '/brand/ibis-stacked.png')
                                                    : (stagedUrl('nav_logo', data.assets.nav_logo) ??
                                                      '/brand/ibis-icon-192.png')
                                            }
                                            alt=''
                                        />
                                        <strong>{draft.company_name}</strong>
                                    </header>
                                )}
                                <div className='space-y-3 p-4'>
                                    <h3 className='text-lg font-semibold'>{previewTitle}</h3>
                                    {previewPage === 'dashboard' && (
                                        <ListRow
                                            className='ibis-preview-card'
                                            data-card-layout={draft.card_layout}
                                            status='success'
                                            style={
                                                draft.banners_enabled && previewBanner && draft.card_layout === 'banner'
                                                    ? {
                                                          backgroundImage: `url("${previewBanner}")`,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <div className='flex items-start gap-2'>
                                                <ListRow.Icon>
                                                    <Server size={18} />
                                                </ListRow.Icon>
                                                <div>
                                                    <ListRow.Title>Example server</ListRow.Title>
                                                    <ListRow.Description>Ready for players</ListRow.Description>
                                                </div>
                                            </div>
                                            <span>Online</span>
                                            <small>India · Local WSL</small>
                                            <small>CPU · Memory · Disk</small>
                                        </ListRow>
                                    )}
                                    {previewPage === 'console' && (
                                        <>
                                            <div className='ibis-preview-terminal'>
                                                [IbisPanel] Server console
                                                <br />
                                                Ready for commands
                                            </div>
                                            <div className='ibis-preview-metrics'>
                                                <Stat
                                                    variant='tile'
                                                    label='CPU'
                                                    value='12 %'
                                                    limit='of 100 %'
                                                    icon={Cpu}
                                                />
                                                <Stat
                                                    variant='tile'
                                                    label='Memory'
                                                    value='512 MiB'
                                                    limit='of 2 GiB'
                                                    icon={MemoryStick}
                                                />
                                                <Stat
                                                    variant='tile'
                                                    label='Disk'
                                                    value='240 MiB'
                                                    limit='of 4 GiB'
                                                    icon={HardDrive}
                                                />
                                                <Stat variant='tile' label='Region' value='India' limit='Local WSL' />
                                            </div>
                                        </>
                                    )}
                                    {previewPage === 'server' && (
                                        <div className='ibis-preview-card'>
                                            <strong>Example server</strong>
                                            <small>Running · India, Local WSL</small>
                                            <span>Address · 203.0.113.10:25565</span>
                                            <small>CPU · Memory · Disk · Network</small>
                                        </div>
                                    )}
                                    {previewPage === 'admin' && (
                                        <>
                                            <div className='ibis-preview-card'>
                                                <strong>Appearance settings</strong>
                                                <small>Branding · Layout · Components</small>
                                            </div>
                                            <div className='ibis-preview-card'>
                                                <strong>Server management</strong>
                                                <small>Nodes · Eggs · Users</small>
                                            </div>
                                        </>
                                    )}
                                    {previewPage === 'login' && (
                                        <div className='ibis-preview-card'>
                                            <label>
                                                Username or email
                                                <input readOnly aria-label='Preview username' />
                                            </label>
                                            <label>
                                                Password
                                                <input readOnly type='password' aria-label='Preview password' />
                                            </label>
                                            <span className='ibis-preview-button'>Login</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className='mt-2 text-xs text-muted-foreground'>
                    Preview uses sample content and does not change the live panel until saved.
                </p>
            </aside>
        </div>
    );
}
