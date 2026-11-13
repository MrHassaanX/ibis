interface SparklineProps {
    readonly points: readonly (number | null)[];
    readonly label: string;
    readonly offline: boolean;
}

/** A compact view of actual bounded Wings samples; no synthetic points or animation. */
export default function Sparkline({ points, label, offline }: SparklineProps) {
    const values = points.filter((value): value is number => value !== null && Number.isFinite(value));

    if (values.length < 2) {
        return <span className='ibis-sparkline-empty'>{offline ? 'Offline' : 'Collecting telemetry…'}</span>;
    }

    const low = Math.min(...values);
    const high = Math.max(...values);
    const spread = Math.max(high - low, high * 0.05, 1);
    const coordinates = values
        .map((value, index) => {
            const x = (index / (values.length - 1)) * 120;
            const y = 24 - ((value - low) / spread) * 19;

            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
    const fill = `0,28 ${coordinates} 120,28`;

    return (
        <svg
            className='ibis-sparkline'
            viewBox='0 0 120 28'
            preserveAspectRatio='none'
            role='img'
            aria-label={`${label} history from live Wings telemetry`}
        >
            <polygon points={fill} fill='currentColor' opacity='0.14' />
            <polyline
                points={coordinates}
                fill='none'
                stroke='currentColor'
                strokeWidth='1.8'
                vectorEffect='non-scaling-stroke'
            />
        </svg>
    );
}
