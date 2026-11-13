import type { AdminVersion } from '@/api/admin/version/queries';
import { Alert } from '@/components/elements/alert';

export default function OverviewVersionCard({ version }: { version: AdminVersion }) {
    return (
        <Alert
            type={version.is_latest ? 'success' : 'warning'}
            title={version.is_latest ? 'Current IbisPanel build' : 'Upstream base release available for review'}
            className='mb-6'
        >
            {version.is_latest ? (
                <>
                    You are running version <code className='font-mono'>{version.current}</code>.
                </>
            ) : (
                <>
                    You are running IbisPanel build <code className='font-mono'>{version.current}</code>. The upstream
                    base reports version{' '}
                    <a
                        href={`https://github.com/pterodactyl/panel/releases/v${version.latest}`}
                        target='_blank'
                        rel='noreferrer'
                        className='font-mono underline transition-colors hover:text-accent'
                    >
                        {version.latest}
                    </a>
                    . Review the upstream{' '}
                    <a
                        href='https://pterodactyl.io/docs/v2/panel/updating'
                        target='_blank'
                        rel='noreferrer'
                        className='underline transition-colors hover:text-accent'
                    >
                        release guidance
                    </a>{' '}
                    before planning an IbisPanel update. Do not install upstream archives over this derivative.
                </>
            )}
        </Alert>
    );
}
