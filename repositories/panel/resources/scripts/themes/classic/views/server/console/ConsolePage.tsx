import { Clock3, Copy, ExternalLink, Globe2, HardDrive, Wifi } from 'lucide-react';
import { Alert, CopyOnClick, countryName, CountryFlag, ServerContentBlock } from '@/sdk';
import { Slot, View, type ServerConsoleModel, type ViewProps } from '@/sdk/theme';
import { panelAppearance } from '../../appearance';
import WorkloadIcon from '../../shared/WorkloadIcon';

const notices = {
    maintenance: 'The node of this server is currently under maintenance and all actions are unavailable.',
    installing: 'This server is currently running its installation process and most actions are unavailable.',
    transferring: 'This server is currently being transferred to another node and all actions are unavailable.',
} satisfies Record<NonNullable<ServerConsoleModel['notice']>, string>;

// oxlint-disable-next-line eslint/complexity -- The console composes capability-dependent live details.
export default function ConsolePage({ model, className }: ViewProps<'page.server.console'>) {
    const status = model.state === null ? 'Connecting' : model.state.charAt(0).toUpperCase() + model.state.slice(1);
    const uptimeMinutes = Math.floor(model.uptime / 60_000);
    const banner = model.server.attributes.banner_url;
    const storageUnit = panelAppearance().storage_unit === 'binary' ? 'Binary (MiB/GiB)' : 'Decimal (MB/GB)';

    return (
        <ServerContentBlock className={className}>
            {model.notice && (
                <Alert type='warning' className='mb-4'>
                    {notices[model.notice]}
                </Alert>
            )}
            <Slot name='server.console.before' data={model.server} />
            <div className='ibis-console-identity mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 sm:gap-4 sm:p-4'>
                {banner && (
                    <img className='ibis-console-identity-banner' src={banner} alt='' aria-hidden decoding='async' />
                )}
                <div className='ibis-workload-icon flex h-16 w-16 shrink-0 items-center justify-center'>
                    <WorkloadIcon src={model.server.attributes.icon_url} />
                </div>
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <h1 className='min-w-0 truncate font-header text-xl font-semibold text-foreground sm:text-2xl'>
                            {model.name}
                        </h1>
                        <span
                            className='ibis-console-status rounded-full border px-2 py-0.5 text-xs'
                            data-state={model.state ?? 'connecting'}
                            role='status'
                        >
                            {status}
                        </span>
                    </div>
                    {model.description && (
                        <p className='mt-1 line-clamp-1 text-sm text-muted-foreground'>{model.description}</p>
                    )}
                    <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                        {model.address && (
                            <CopyOnClick text={model.address}>
                                <span
                                    className='inline-flex max-w-full cursor-copy items-center gap-1'
                                    title={`Copy ${model.address}`}
                                >
                                    <span className='truncate'>{model.address}</span>
                                    <Copy size={12} aria-hidden />
                                </span>
                            </CopyOnClick>
                        )}
                        {model.region && (
                            <span className='inline-flex items-center gap-1'>
                                <Globe2 size={12} aria-hidden />
                                <CountryFlag code={model.region.country_code} />
                                {model.region.country_code ? countryName(model.region.country_code) : model.region.name}
                                {model.region.name && ` · ${model.region.name}`}
                            </span>
                        )}
                        {model.state === 'running' && uptimeMinutes > 0 && (
                            <span className='inline-flex items-center gap-1'>
                                <Clock3 size={12} aria-hidden /> Up {Math.floor(uptimeMinutes / 60)}h{' '}
                                {uptimeMinutes % 60}m
                            </span>
                        )}
                    </div>
                </div>
                <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
                    {model.website && (
                        <div className='flex flex-wrap items-center gap-2 text-xs'>
                            <span className='text-muted-foreground'>{model.website.label}</span>
                            <a
                                className='inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 font-semibold text-foreground hover:border-primary hover:text-primary'
                                href={model.website.url}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                <ExternalLink size={14} aria-hidden /> Open Website
                            </a>
                            <CopyOnClick text={model.website.url}>
                                <button
                                    type='button'
                                    className='rounded-md border border-border bg-background px-3 py-2 text-foreground'
                                    aria-label='Copy website URL'
                                >
                                    <Copy size={14} aria-hidden />
                                </button>
                            </CopyOnClick>
                        </div>
                    )}
                    <View name='server.power' />
                </div>
            </div>
            <View name='server.stats' className='mb-4' />
            <div className='ibis-console-body mb-4'>
                <div className='ibis-console-panel min-w-0 overflow-hidden rounded-lg border border-border bg-card'>
                    <View name='server.terminal' />
                </div>
                <section
                    className='ibis-server-info rounded-lg border border-border bg-card'
                    aria-label='Server Information'
                >
                    <h2 className='border-b border-border px-4 py-3 text-sm font-semibold'>Server Information</h2>
                    <dl>
                        <div>
                            <dt>
                                <Wifi size={17} aria-hidden /> Address
                            </dt>
                            <dd>{model.address ?? 'No allocation'}</dd>
                        </div>
                        <div>
                            <dt>
                                <Clock3 size={17} aria-hidden /> Uptime
                            </dt>
                            <dd>
                                {model.state === 'running'
                                    ? `${Math.floor(uptimeMinutes / 60)}h ${uptimeMinutes % 60}m`
                                    : 'Not running'}
                            </dd>
                        </div>
                        {model.region && (
                            <div>
                                <dt>
                                    <Globe2 size={17} aria-hidden /> Region
                                </dt>
                                <dd>
                                    <CountryFlag code={model.region.country_code} />{' '}
                                    {model.region.country_code
                                        ? countryName(model.region.country_code)
                                        : model.region.name}
                                    {model.region.name && ` · ${model.region.name}`}
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt>
                                <HardDrive size={17} aria-hidden /> Storage unit
                            </dt>
                            <dd>{storageUnit}</dd>
                        </div>
                    </dl>
                </section>
            </div>
            <details className='ibis-telemetry-details mb-4 rounded-lg border border-border bg-card p-3'>
                <summary className='cursor-pointer text-sm font-semibold'>Detailed telemetry</summary>
                <View name='server.graphs' className='mt-3' />
            </details>
            <Slot name='server.console.after' data={model.server} />
            {model.features.map((name) => (
                <View key={name} name={name} />
            ))}
        </ServerContentBlock>
    );
}
