import type { ServerRunState } from '@/views/server/state';

export type ConsoleStatus = {
    readonly label: 'Connected' | 'Offline' | 'Starting' | 'Stopping' | 'Disconnected' | 'Checking status';
    readonly tone: 'success' | 'neutral' | 'warning' | 'danger';
};

/** The socket reports transport availability; only Wings process state reports whether a server runs. */
export function consoleStatus(state: ServerRunState | null, connected: boolean): ConsoleStatus {
    if (state === 'offline') {
        return { label: 'Offline', tone: 'neutral' };
    }

    if (state === 'starting') {
        return { label: 'Starting', tone: 'warning' };
    }

    if (state === 'stopping') {
        return { label: 'Stopping', tone: 'warning' };
    }

    if (state === 'running') {
        return connected ? { label: 'Connected', tone: 'success' } : { label: 'Disconnected', tone: 'danger' };
    }

    return { label: 'Checking status', tone: 'neutral' };
}
