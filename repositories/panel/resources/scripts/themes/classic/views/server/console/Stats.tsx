import { ArrowDownUp, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { bytesToString, cn, Stat } from '@/sdk';
import type { ServerStatMetric, UiTone, ViewProps } from '@/sdk/theme';
import Sparkline from './Sparkline';

const tone = (metric: ServerStatMetric): UiTone => metric.alarm ?? 'neutral';
const meter = (metric: ServerStatMetric): number | undefined =>
    metric.limit > 0 ? Math.min(100, Math.max(0, (metric.value / metric.limit) * 100)) : undefined;
const limit = (value: number, unit = '') => (value > 0 ? `of ${unit || bytesToString(value)}` : 'Unlimited');

export default function Stats({ model, className }: ViewProps<'server.stats'>) {
    const offline = model.state === 'offline';
    const { cpu, memory, disk } = model;
    const history = model.history;

    return (
        <div className={cn('ibis-console-metrics grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
            <Stat
                icon={Cpu}
                label='CPU usage'
                value={offline ? 'Offline' : `${cpu.value.toFixed(2)}%`}
                limit={offline ? undefined : limit(cpu.limit, `${cpu.limit}%`)}
                meter={offline ? undefined : meter(cpu)}
                tone={tone(cpu)}
                unavailable={offline}
                trend={<Sparkline points={history.cpu.map((point) => point.value)} label='CPU' offline={offline} />}
            />
            <Stat
                icon={MemoryStick}
                label='Memory'
                value={offline ? 'Offline' : bytesToString(memory.value)}
                limit={offline ? undefined : limit(memory.limit)}
                meter={offline ? undefined : meter(memory)}
                tone={tone(memory)}
                unavailable={offline}
                trend={
                    <Sparkline points={history.memory.map((point) => point.value)} label='Memory' offline={offline} />
                }
            />
            <Stat
                icon={HardDrive}
                label='Disk'
                value={bytesToString(disk.value)}
                limit={limit(disk.limit)}
                meter={meter(disk)}
                tone={tone(disk)}
                trend={<Sparkline points={history.disk.map((point) => point.value)} label='Disk' offline={offline} />}
            />
            <Stat
                className='ibis-network-stat'
                icon={ArrowDownUp}
                label='Network'
                value={
                    offline ? (
                        'Offline'
                    ) : (
                        <span className='ibis-network-values text-sm'>
                            ↓ {bytesToString(model.network.rx)} <span className='text-muted-foreground'>/</span> ↑{' '}
                            {bytesToString(model.network.tx)}
                        </span>
                    )
                }
                limit={offline ? undefined : 'Traffic totals'}
                unavailable={offline}
                trend={
                    <Sparkline
                        points={history.network.map((point) =>
                            point.rx === null || point.tx === null ? null : point.rx + point.tx
                        )}
                        label='Network throughput'
                        offline={offline}
                    />
                }
            />
        </div>
    );
}
