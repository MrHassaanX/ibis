import type { PanelSoundChoice, PanelSoundPreferences } from '@/api/account/types';

type ServerState = 'offline' | 'starting' | 'stopping' | 'running' | null;
export type ServerSoundEvent = 'started' | 'stopped';

/** Only a confirmed transition within a connected session is audible. */
export function soundForServerTransition(
    previous: ServerState,
    current: ServerState,
    wasConnected: boolean,
    connected: boolean
): ServerSoundEvent | null {
    if (!wasConnected || !connected || previous === null || current === null || previous === current) {
        return null;
    }

    if (current === 'running' && (previous === 'starting' || previous === 'offline')) {
        return 'started';
    }

    if (current === 'offline' && (previous === 'stopping' || previous === 'running')) {
        return 'stopped';
    }

    return null;
}

let audioContext: AudioContext | null = null;

/** Original two-note Web Audio tones; no third-party sound files or external requests. */
export async function playPanelSound(
    event: ServerSoundEvent,
    choice: PanelSoundChoice,
    volume: number
): Promise<boolean> {
    if (choice === 'off' || volume <= 0 || !window.AudioContext) {
        return false;
    }

    try {
        const context = audioContext ?? new window.AudioContext();

        audioContext = context;

        if (context.state === 'suspended') {
            await context.resume();
        }

        if (context.state !== 'running') {
            return false;
        }

        const frequencies = event === 'started' ? [523, 784] : [523, 349];
        const now = context.currentTime;
        const gain = Math.min(1, Math.max(0, volume / 100)) * 0.12;

        for (const [index, frequency] of frequencies.entries()) {
            const oscillator = context.createOscillator();
            const envelope = context.createGain();
            const start = now + index * 0.11;

            oscillator.type = choice === 'bright' ? 'triangle' : 'sine';
            oscillator.frequency.setValueAtTime(frequency, start);
            envelope.gain.setValueAtTime(0, start);
            envelope.gain.linearRampToValueAtTime(gain, start + 0.015);
            envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.17);
            oscillator.connect(envelope).connect(context.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.18);
        }

        return true;
    } catch {
        // Browsers may refuse audio until the visitor interacts with the page.
        return false;
    }
}

export function playServerTransition(event: ServerSoundEvent, preferences: PanelSoundPreferences): void {
    if (!preferences.enabled) {
        return;
    }

    void playPanelSound(event, preferences[event], preferences.volume);
}
