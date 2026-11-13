export type PanelSoundChoice = 'off' | 'soft' | 'bright';

export interface PanelSoundPreferences {
    enabled: boolean;
    volume: number;
    started: PanelSoundChoice;
    stopped: PanelSoundChoice;
}

export const DEFAULT_PANEL_SOUNDS: PanelSoundPreferences = {
    enabled: false,
    volume: 35,
    started: 'soft',
    stopped: 'soft',
};

export function normalizePanelSounds(
    input: { enabled: boolean; volume: number; started: string; stopped: string } | null | undefined
): PanelSoundPreferences {
    if (!input) {
        return DEFAULT_PANEL_SOUNDS;
    }

    const choice = (item: string) => item === 'off' || item === 'soft' || item === 'bright';

    return Number.isInteger(input.volume) &&
        input.volume >= 0 &&
        input.volume <= 100 &&
        choice(input.started) &&
        choice(input.stopped)
        ? (input as PanelSoundPreferences)
        : DEFAULT_PANEL_SOUNDS;
}

export interface UserData {
    uuid: string;
    username: string;
    email: string;
    language: string;
    rootAdmin: boolean;
    useTotp: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Only set on users loaded through the Application API.
    id?: number;
    firstName?: string;
    lastName?: string;
    externalId?: string | null;
    appearanceMode?: 'system' | 'oled' | 'light' | 'legacy' | null;
    soundPreferences?: PanelSoundPreferences;
}
