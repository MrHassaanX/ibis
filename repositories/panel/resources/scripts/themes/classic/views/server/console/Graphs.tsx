import { CloudDownload, CloudUpload } from 'lucide-react';
import { AreaChart, bytesToString, ChartCard, cn, Tooltip, type ChartSeries } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';

const CYAN = 'var(--chart-1)';
const YELLOW = 'var(--chart-2)';

const VALUE_SERIES: ChartSeries[] = [{ dataKey: 'value', color: CYAN }];
const NETWORK_SERIES: ChartSeries[] = [
    { dataKey: 'tx', color: CYAN },
    { dataKey: 'rx', color: YELLOW },
];

function EmptyGraph({ live }: { live: boolean }) {
    return (
        <div className='flex h-[96px] items-center justify-center text-center text-xs text-muted-foreground'>
            {live ? 'Collecting live telemetry…' : 'No live telemetry while offline'}
        </div>
    );
}

export default function Graphs({ model, className }: ViewProps<'server.graphs'>) {
    const { live, windowMs } = model;

    return (
        <div className={cn('ibis-console-graphs grid min-w-0 gap-3', className)}>
            <ChartCard title='CPU Load'>
                {model.cpu.points.length < 2 ? (
                    <EmptyGraph live={live} />
                ) : (
                    <AreaChart
                        data={model.cpu.points}
                        series={VALUE_SERIES}
                        live={live}
                        windowMs={windowMs}
                        suggestedMax={model.cpu.limit}
                        tickFormatter={(value) => `${value.toFixed(2)}%`}
                        height={96}
                    />
                )}
            </ChartCard>
            <ChartCard title='Memory'>
                {model.memory.points.length < 2 ? (
                    <EmptyGraph live={live} />
                ) : (
                    <AreaChart
                        data={model.memory.points}
                        series={VALUE_SERIES}
                        live={live}
                        windowMs={windowMs}
                        suggestedMax={model.memory.limit}
                        tickFormatter={bytesToString}
                        height={96}
                    />
                )}
            </ChartCard>
            <ChartCard
                title='Network throughput'
                legend={
                    <>
                        <Tooltip arrow content='Inbound'>
                            <CloudDownload className='mr-2 w-4 h-4 text-chart-2' />
                        </Tooltip>
                        <Tooltip arrow content='Outbound'>
                            <CloudUpload className='w-4 h-4 text-chart-1' />
                        </Tooltip>
                    </>
                }
            >
                {model.network.points.length < 2 ? (
                    <EmptyGraph live={live} />
                ) : (
                    <AreaChart
                        data={model.network.points}
                        series={NETWORK_SERIES}
                        live={live}
                        windowMs={windowMs}
                        tickFormatter={(value) =>
                            value < 1024 ? `${Math.round(value)} B/s` : `${bytesToString(value)}/s`
                        }
                        height={96}
                    />
                )}
            </ChartCard>
        </div>
    );
}
