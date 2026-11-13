import { describe, expect, it } from 'vitest';
import { bytesPerSecond } from './stats';

describe('Wings network throughput', () => {
    it('normalizes transferred bytes by the actual interval between reports', () => {
        expect(bytesPerSecond(2_500, 1_000, 2_000)).toBe(750);
        expect(bytesPerSecond(2_500, 1_000, 500)).toBe(3_000);
    });

    it('has no rate for first samples, counter resets, or invalid intervals', () => {
        expect(bytesPerSecond(1_000, -1, 1_000)).toBeNull();
        expect(bytesPerSecond(500, 1_000, 1_000)).toBeNull();
        expect(bytesPerSecond(1_000, 500, 0)).toBeNull();
    });
});
