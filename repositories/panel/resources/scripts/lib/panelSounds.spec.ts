// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { DEFAULT_PANEL_SOUNDS, normalizePanelSounds } from '@/api/account/types';
import { playPanelSound, soundForServerTransition } from './panelSounds';

it('sounds only for confirmed connected starts and stops', () => {
    expect(soundForServerTransition(null, 'running', true, true)).toBeNull();
    expect(soundForServerTransition('starting', 'offline', true, true)).toBeNull();
    expect(soundForServerTransition('starting', 'running', true, true)).toBe('started');
    expect(soundForServerTransition('offline', 'running', true, true)).toBe('started');
    expect(soundForServerTransition('stopping', 'offline', true, true)).toBe('stopped');
    expect(soundForServerTransition('running', 'offline', true, true)).toBe('stopped');
    expect(soundForServerTransition('running', 'running', true, true)).toBeNull();
    expect(soundForServerTransition('starting', 'running', false, true)).toBeNull();
    expect(soundForServerTransition('starting', 'running', true, false)).toBeNull();
});

it('keeps malformed stored preferences muted', () => {
    expect(normalizePanelSounds(null)).toBe(DEFAULT_PANEL_SOUNDS);
    expect(normalizePanelSounds({ enabled: true, volume: 200, started: 'soft', stopped: 'soft' })).toBe(
        DEFAULT_PANEL_SOUNDS
    );
    expect(normalizePanelSounds({ enabled: true, volume: 40, started: 'paid-theme', stopped: 'soft' })).toBe(
        DEFAULT_PANEL_SOUNDS
    );
    expect(normalizePanelSounds({ enabled: true, volume: 40, started: 'bright', stopped: 'off' })).toEqual({
        enabled: true,
        volume: 40,
        started: 'bright',
        stopped: 'off',
    });
});

it('respects mute and an autoplay refusal without throwing', async () => {
    expect(await playPanelSound('started', 'off', 40)).toBe(false);
    expect(await playPanelSound('stopped', 'soft', 0)).toBe(false);
    vi.stubGlobal(
        'AudioContext',
        class {
            state = 'suspended';
            resume = () => Promise.reject(new Error('NotAllowedError'));
        }
    );
    expect(await playPanelSound('started', 'soft', 40)).toBe(false);
    vi.unstubAllGlobals();
});
