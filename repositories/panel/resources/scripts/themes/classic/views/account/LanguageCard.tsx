import { useMemo, useState } from 'react';
import {
    ContentBox,
    http,
    httpErrorToHuman,
    toast,
    updateLanguagePreference,
    useCurrentUser,
    usePanelTranslation,
    useSiteSettings,
} from '@/sdk';

const names = { en: 'English', hi: 'हिन्दी', es: 'Español' } as const;

type Language = keyof typeof names;

export default function LanguageCard() {
    const { t } = usePanelTranslation('appearance');
    const user = useCurrentUser();
    const settings = useSiteSettings().appearance;
    const [busy, setBusy] = useState(false);
    const enabled = settings?.enabled_languages ?? ['en'];
    const suggested = useMemo(() => navigator.language.slice(0, 2) as Language, []);

    if (settings?.allow_language_override === false) {
        return null;
    }

    const save = async (language: Language) => {
        setBusy(true);
        try {
            await http.put('/api/client/account/preferences', { language });
            updateLanguagePreference(language);
            toast.success(t('language_saved'));
            window.location.reload();
        } catch (error) {
            toast.error(httpErrorToHuman(error));
        } finally {
            setBusy(false);
        }
    };

    return (
        <ContentBox className='ibis-account-language' title={t('language')}>
            <label className='block text-sm'>
                {t('choose_language')}
                <select
                    className='mt-2 w-full rounded-md border border-border bg-background p-2 text-foreground'
                    value={user.language}
                    disabled={busy}
                    onChange={(event) => void save(event.target.value as Language)}
                >
                    {enabled.map((language) => (
                        <option key={language} value={language}>
                            {names[language]}
                        </option>
                    ))}
                </select>
            </label>
            {settings?.language_suggestions && enabled.includes(suggested) && suggested !== user.language && (
                <p className='mt-3 text-sm text-muted-foreground'>
                    {t('browser_suggestion', { language: names[suggested] })}{' '}
                    <button
                        type='button'
                        className='text-primary underline'
                        disabled={busy}
                        onClick={() => void save(suggested)}
                    >
                        {t('use_suggestion')}
                    </button>
                </p>
            )}
        </ContentBox>
    );
}
