import { describe, expect, it } from 'vitest';
import { consoleStatus } from './consoleStatus';

describe('console process and socket status', () => {
    it('shows Connected only for a running process with a connected socket', () => {
        expect(consoleStatus('running', true)).toEqual({ label: 'Connected', tone: 'success' });
        expect(consoleStatus('running', false)).toEqual({ label: 'Disconnected', tone: 'danger' });
    });

    it('keeps offline, transitional and unknown states distinct from socket connectivity', () => {
        expect(consoleStatus('offline', true)).toEqual({ label: 'Offline', tone: 'neutral' });
        expect(consoleStatus('starting', true)).toEqual({ label: 'Starting', tone: 'warning' });
        expect(consoleStatus('stopping', true)).toEqual({ label: 'Stopping', tone: 'warning' });
        expect(consoleStatus(null, true)).toEqual({ label: 'Checking status', tone: 'neutral' });
        expect(consoleStatus(null, false)).toEqual({ label: 'Checking status', tone: 'neutral' });
    });

    it('tracks restart transitions without announcing a stopped process as connected', () => {
        expect(
            ['running', 'stopping', 'offline', 'starting', 'running'].map(
                (state) => consoleStatus(state as 'running' | 'stopping' | 'offline' | 'starting', true).label
            )
        ).toEqual(['Connected', 'Stopping', 'Offline', 'Starting', 'Connected']);
    });
});
