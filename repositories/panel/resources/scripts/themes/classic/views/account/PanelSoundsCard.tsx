import { useEffect, useState } from 'react';
import {
    DEFAULT_PANEL_SOUNDS,
    http,
    httpErrorToHuman,
    playPanelSound,
    toast,
    updateCurrentUser,
    useCurrentUser,
    type PanelSoundChoice,
    type PanelSoundPreferences,
} from '@/sdk';

const choices: { value: PanelSoundChoice; label: string }[] = [
    { value: 'off', label: 'None' },
    { value: 'soft', label: 'Soft chime' },
    { value: 'bright', label: 'Bright pulse' },
];

export default function PanelSoundsCard() {
    const user = useCurrentUser();
    const saved = user.soundPreferences ?? DEFAULT_PANEL_SOUNDS;
    const [draft, setDraft] = useState<PanelSoundPreferences>(saved);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => setDraft(saved), [saved]);

    const update = <K extends keyof PanelSoundPreferences>(key: K, value: PanelSoundPreferences[K]) =>
        setDraft((current) => ({ ...current, [key]: value }));

    const persist = async (preferences: PanelSoundPreferences) => {
        setBusy(true);
        setError('');
        try {
            await http.put('/api/client/account/preferences', { sound_preferences: preferences });
            updateCurrentUser({ soundPreferences: preferences });
            setDraft(preferences);
            toast.success('Panel sound preferences saved');
        } catch (cause) {
            setError(httpErrorToHuman(cause));
        } finally {
            setBusy(false);
        }
    };

    const test = async (event: 'started' | 'stopped') => {
        if (draft[event] === 'off' || draft.volume === 0) {
            return;
        }

        if (!(await playPanelSound(event, draft[event], draft.volume))) {
            toast.error('Sound unavailable. Interact with this page and check your browser audio settings.');
        }
    };

    return (
        <section className='ibis-account-card rounded-lg border border-border bg-card p-5' aria-label='Panel Sounds'>
            <h2 className='font-header text-lg font-semibold'>Panel Sounds</h2>
            <p className='mt-1 text-sm text-muted-foreground'>
                Optional sounds for confirmed state changes on the server you are viewing.
            </p>
            <label className='mt-4 flex items-center gap-3 text-sm'>
                <input
                    type='checkbox'
                    checked={draft.enabled}
                    onChange={(event) => update('enabled', event.target.checked)}
                />
                Enable panel sounds
            </label>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                {(['started', 'stopped'] as const).map((event) => (
                    <label key={event} className='text-sm'>
                        Server {event} sound
                        <select
                            className='mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
                            value={draft[event]}
                            onChange={(change) => update(event, change.target.value as PanelSoundChoice)}
                        >
                            {choices.map((choice) => (
                                <option key={choice.value} value={choice.value}>
                                    {choice.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type='button'
                            className='mt-2 text-xs text-primary underline'
                            onClick={() => void test(event)}
                        >
                            Test {event} sound
                        </button>
                    </label>
                ))}
            </div>
            <label className='mt-4 block text-sm'>
                Volume: <output>{draft.volume}%</output>
                <input
                    className='mt-2 w-full accent-primary'
                    type='range'
                    min='0'
                    max='100'
                    value={draft.volume}
                    onInput={(event) => update('volume', Number(event.currentTarget.value))}
                    onChange={(event) => update('volume', Number(event.target.value))}
                />
            </label>
            <p className='mt-1 text-xs text-muted-foreground'>
                Your browser may require an interaction before a sound can play. Sounds are off by default.
            </p>
            {error && (
                <p role='alert' className='mt-3 text-sm text-destructive'>
                    {error}
                </p>
            )}
            <div className='mt-4 flex flex-wrap gap-2'>
                <button
                    type='button'
                    disabled={busy || JSON.stringify(draft) === JSON.stringify(saved)}
                    className='rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50'
                    onClick={() => void persist(draft)}
                >
                    Save sounds
                </button>
                <button
                    type='button'
                    disabled={busy}
                    className='rounded-md border border-border px-4 py-2 text-sm'
                    onClick={() => void persist(DEFAULT_PANEL_SOUNDS)}
                >
                    Restore defaults
                </button>
            </div>
        </section>
    );
}
