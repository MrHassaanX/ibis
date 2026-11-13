import { Card, CopyOnClick, CountryFlag } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

export default function ServerDebug({ model, className }: ViewProps<'server.debug'>) {
    return (
        <Card title='Debug Information' className={className}>
            <div className='flex items-center justify-between text-sm'>
                <p>Node</p>
                <code className='font-mono bg-muted rounded-sm py-1 px-2'>{model.node}</code>
            </div>
            {model.region && (
                <div className='flex items-center justify-between mt-2 text-sm'>
                    <p>Region</p>
                    <span>
                        <CountryFlag code={model.region.country_code} />{' '}
                        {model.region.label || model.region.name || model.region.country_code}
                    </span>
                </div>
            )}
            <CopyOnClick text={model.uuid}>
                <div className='flex items-center justify-between mt-2 text-sm'>
                    <p>Server ID</p>
                    <code className='font-mono bg-muted rounded-sm py-1 px-2'>{model.uuid}</code>
                </div>
            </CopyOnClick>
        </Card>
    );
}
