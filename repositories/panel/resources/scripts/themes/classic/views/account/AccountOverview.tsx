import { Alert, PageContentBlock, PageHeading } from '@/sdk';
import { Slot, View, type ViewProps } from '@/sdk/theme';
import LanguageCard from './LanguageCard';
import PanelSoundsCard from './PanelSoundsCard';
import ProfileCard from './ProfileCard';

export default function AccountOverview({ model, className }: ViewProps<'page.account.overview'>) {
    return (
        <PageContentBlock title='Account Overview' className={className}>
            <PageHeading title='Account' description='Manage your profile, credentials, and account security.' />
            {model.twoFactorRequired && (
                <Alert title='2-Factor Required' type='danger'>
                    Your account must have two-factor authentication enabled in order to continue.
                </Alert>
            )}
            <Slot name='account.overview.before' />
            <div className='ibis-account-grid mb-10 grid gap-5 lg:grid-cols-2'>
                <div className='min-w-0 space-y-5'>
                    <ProfileCard />
                    <LanguageCard />
                    <PanelSoundsCard />
                </div>
                <div className='min-w-0 space-y-5'>
                    <View name='account.password' />
                    <View name='account.email' />
                    <View name='account.twoFactor' />
                </div>
            </div>
            <Slot name='account.overview.after' />
        </PageContentBlock>
    );
}
