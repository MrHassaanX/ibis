import { useEffect, useRef } from 'react';
import { DEFAULT_PANEL_SOUNDS } from '@/api/account/types';
import { useCurrentUser } from '@/api/account/queries';
import { playServerTransition, soundForServerTransition } from '@/lib/panelSounds';
import { useServerStatus, useSocketConnected } from '@/state/server';

/** Only listens while the user is inside this server's own area. */
export default function ServerSoundListener() {
    const status = useServerStatus();
    const connected = useSocketConnected();
    const preferences = useCurrentUser().soundPreferences ?? DEFAULT_PANEL_SOUNDS;
    const previous = useRef({ status, connected });

    useEffect(() => {
        const event = soundForServerTransition(previous.current.status, status, previous.current.connected, connected);

        previous.current = { status, connected };
        if (event) {
            playServerTransition(event, preferences);
        }
    }, [status, connected, preferences]);

    return null;
}
