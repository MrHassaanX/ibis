import { Button, PanelLink, changeGuestLanguage, usePanelTranslation, useSiteSettings } from '@/sdk';
import { Slot, type ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';
import AuthCard, { authLinkClass } from './AuthCard';

export default function LoginPage({ model, className }: ViewProps<'page.auth.login'>) {
    const { fields, Captcha } = model;
    const { locale, t } = usePanelTranslation('appearance');
    const appearance = useSiteSettings().appearance;
    const languages = appearance?.enabled_languages ?? ['en'];

    return (
        <AuthCard title={t('login_title')} submit={model.submit} className={className}>
            <TextField field={fields.username} light label={t('username_or_email')} />
            <div className='mt-6'>
                <TextField field={fields.password} light label={t('password')} />
            </div>
            <div className='mt-6'>
                <Button type='submit' size='xlarge' disabled={!model.canSubmit} isLoading={model.submitting}>
                    {t('login')}
                </Button>
            </div>
            <Slot name='auth.login.form.after' data={model.route} />
            {Captcha && <Captcha />}
            <div className='mt-6 text-center'>
                <PanelLink destination={model.forgotPassword} className={authLinkClass}>
                    {t('forgot_password')}
                </PanelLink>
            </div>
            {appearance?.allow_language_override !== false && languages.length > 1 && (
                <div className='mt-4 text-center text-sm'>
                    <label className='text-muted-foreground'>
                        {t('language')}{' '}
                        <select
                            aria-label={t('language')}
                            value={locale.slice(0, 2)}
                            className='rounded-md border border-border bg-background p-1 text-foreground'
                            onChange={(event) => changeGuestLanguage(event.target.value)}
                        >
                            {languages.map((language) => (
                                <option key={language} value={language}>
                                    {{ en: 'English', hi: 'हिन्दी', es: 'Español' }[language]}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </AuthCard>
    );
}
