import { cn, countryName, CountryFlag, ListRow } from '@/sdk';
import { Slot, type ViewProps } from '@/sdk/theme';
import WorkloadIcon from '../shared/WorkloadIcon';

function statusLabel(state: ViewProps<'dashboard.serverCard.identity'>['model']['state']): string {
    if (state.kind === 'loading') {
        return 'Loading';
    }

    if (state.kind === 'unavailable') {
        return state.reason.replaceAll('-', ' ');
    }

    if (state.power === 'running') {
        return 'Online';
    }

    if (state.power === 'offline') {
        return 'Offline';
    }

    return state.power;
}

export default function ServerCardIdentity({ model, server, className }: ViewProps<'dashboard.serverCard.identity'>) {
    return (
        <div className={cn('ibis-server-card-identity flex min-w-0 items-center', className)}>
            <ListRow.Icon className='ibis-server-card-icon mr-4'>
                <WorkloadIcon className='ibis-workload-card-icon' src={server.attributes.icon_url} />
            </ListRow.Icon>
            <div className='ibis-server-card-name min-w-0'>
                <ListRow.Title className='ibis-server-title'>{model.name}</ListRow.Title>
                {!!model.description && (
                    <ListRow.Description className='ibis-server-description'>{model.description}</ListRow.Description>
                )}
                <span className='ibis-server-status' role='status'>
                    {statusLabel(model.state)}
                </span>
                {server.attributes.region && (
                    <p className='text-xs text-muted-foreground'>
                        <CountryFlag code={server.attributes.region.country_code} />{' '}
                        {[
                            server.attributes.region.country_code && countryName(server.attributes.region.country_code),
                            server.attributes.region.name,
                            server.attributes.region.label,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                )}
            </div>
            <Slot name='dashboard.serverRow.name.after' data={server} />
        </div>
    );
}
