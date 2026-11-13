const fallback = '/brand/workloads/generic-server.svg';

/** A missing uploaded asset falls back once without disrupting the surrounding card. */
export default function WorkloadIcon({ src, className }: { src: string; className?: string }) {
    return (
        <img
            src={src}
            className={className}
            alt=''
            aria-hidden
            decoding='async'
            onError={(event) => {
                if (!event.currentTarget.src.endsWith(fallback)) {
                    event.currentTarget.src = fallback;
                }
            }}
        />
    );
}
