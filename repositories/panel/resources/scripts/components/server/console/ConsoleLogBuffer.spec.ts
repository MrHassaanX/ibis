import { describe, expect, it } from 'vitest';
import { ConsoleLogBuffer } from './ConsoleLogBuffer';

describe('ConsoleLogBuffer', () => {
    it('classifies structured levels while preserving ANSI and multiline continuation', () => {
        const buffer = new ConsoleLogBuffer();

        buffer.append('\u001b[36m[12:00:01 INFO]: Ready\u001b[0m');
        buffer.append('[12:00:02 WARN]: Slow tick\n    at game.Tick.loop(Tick.java:7)');
        buffer.append('ERROR: Startup failed');
        buffer.append('daemon failure without a prefix', 'error');
        buffer.append('ordinary player chat');

        expect(buffer.counts()).toEqual({ all: 6, warning: 2, error: 2 });
        expect(buffer.visible('warning', '')).toHaveLength(2);
        expect(buffer.visible('error', 'startup')).toHaveLength(1);
        expect(buffer.visible('all', 'READY')[0].raw).toContain('\u001b[36m');
    });

    it('clears only the local buffer and bounds its retained history', () => {
        const buffer = new ConsoleLogBuffer();

        for (let index = 0; index < 2_020; index++) {
            buffer.append(`line ${index}`);
        }

        expect(buffer.counts().all).toBe(2_000);
        expect(buffer.visible('all', 'line 0')).toHaveLength(0);
        buffer.clear();
        expect(buffer.counts()).toEqual({ all: 0, warning: 0, error: 0 });
    });
});
