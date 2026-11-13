import { appendChartPoint, chartValue, type ServerGraphs } from '@/components/server/console/chart';
import type { ServerStatsPayload } from '@/components/server/console/stats';
import type { ServerSet } from '@/state/server/types';

/** The latest resource usage Wings reported; every value is 0 until the first report. */
export interface ServerStatsSample {
    readonly cpu: number;
    readonly memory: number;
    readonly disk: number;
    readonly rx: number;
    readonly tx: number;
    /** Milliseconds since the server started. */
    readonly uptime: number;
}

export interface ServerStatsStore {
    current: ServerStatsSample;
    /** Rolling samples for the graphs, `t` being a performance.now() timestamp. */
    graphs: ServerGraphs;
    /** Network counters and monotonic timestamp from the previous report. */
    totals: { tx: number; rx: number; t: number | null };
    push: (payload: ServerStatsPayload, t: number) => void;
    clearGraphs: () => void;
}

export const emptyStatsSample: ServerStatsSample = { cpu: 0, memory: 0, disk: 0, rx: 0, tx: 0, uptime: 0 };
export const emptyGraphs: ServerGraphs = { cpu: [], memory: [], disk: [], network: [] };

/** Counter resets and the first report have no rate until a valid next sample arrives. */
export const bytesPerSecond = (total: number, previous: number, elapsedMs: number): number | null =>
    previous < 0 || total < previous || elapsedMs <= 0 ? null : chartValue(((total - previous) * 1000) / elapsedMs);

export const createStats = (set: ServerSet): ServerStatsStore => ({
    current: emptyStatsSample,
    graphs: emptyGraphs,
    totals: { tx: -1, rx: -1, t: null },
    push: (payload, t) =>
        set(({ stats }) => ({
            stats: {
                ...stats,
                current: {
                    cpu: payload.cpu_absolute,
                    memory: payload.memory_bytes,
                    disk: payload.disk_bytes,
                    rx: payload.network.rx_bytes,
                    tx: payload.network.tx_bytes,
                    uptime: payload.uptime || 0,
                },
                graphs: {
                    cpu: appendChartPoint(stats.graphs.cpu, { t, value: chartValue(payload.cpu_absolute) }),
                    memory: appendChartPoint(stats.graphs.memory, { t, value: chartValue(payload.memory_bytes) }),
                    disk: appendChartPoint(stats.graphs.disk, { t, value: chartValue(payload.disk_bytes) }),
                    network: appendChartPoint(stats.graphs.network, {
                        t,
                        tx: bytesPerSecond(payload.network.tx_bytes, stats.totals.tx, t - (stats.totals.t ?? t)),
                        rx: bytesPerSecond(payload.network.rx_bytes, stats.totals.rx, t - (stats.totals.t ?? t)),
                    }),
                },
                totals: { tx: payload.network.tx_bytes, rx: payload.network.rx_bytes, t },
            },
        })),
    clearGraphs: () =>
        set(({ stats }) => ({ stats: { ...stats, graphs: emptyGraphs, totals: { tx: -1, rx: -1, t: null } } })),
});
