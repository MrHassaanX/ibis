import { EthernetPort } from 'lucide-react';
import { cn } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function ServerCardAddress({ model, className }: ViewProps<'dashboard.serverCard.address'>) {
    return (
        <div className={cn('ibis-server-card-address min-w-0', className)}>
            <div className='flex min-w-0 items-center gap-2'>
                <EthernetPort size='1em' className='inline-block shrink-0 text-muted-foreground' />
                <p className='truncate text-sm text-muted-foreground' title={model.address ?? undefined}>
                    {model.address ?? 'No allocation'}
                </p>
            </div>
        </div>
    );
}
