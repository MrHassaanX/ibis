import { panelAppearance, panelName } from '../appearance';

/** Official IbisPanel wordmark; the source PNG is retained in public/brand. */
export default function IbisMark({ className }: { className?: string }) {
    const assets = panelAppearance().assets;

    return (
        <span className='ibis-auth-logo'>
            <img
                src={assets?.login_logo ?? '/brand/ibis-stacked.png'}
                alt={panelName()}
                className={`ibis-auth-mark ibis-auth-logo-dark ${className ?? ''}`}
            />
            <img
                src={assets?.login_logo_light ?? assets?.login_logo ?? '/brand/ibis-stacked.png'}
                alt=''
                className={`ibis-auth-mark ibis-auth-logo-light ${className ?? ''}`}
            />
        </span>
    );
}
