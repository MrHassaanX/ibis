export type PropertyCategory =
    | 'General'
    | 'Gameplay'
    | 'World'
    | 'Players'
    | 'Network'
    | 'Security'
    | 'Performance'
    | 'Advanced';
export type PropertyField = 'text' | 'number' | 'boolean' | 'select';

export interface PropertyDefinition {
    key: string;
    label: string;
    description: string;
    category: PropertyCategory;
    field: PropertyField;
    options?: readonly string[];
    min?: number;
    max?: number;
    warning?: string;
}

// These are common Java Edition keys. Unrecognized and version-specific keys stay in the file.
export const PROPERTY_DEFINITIONS: readonly PropertyDefinition[] = [
    {
        key: 'motd',
        label: 'Message of the day',
        description: 'Text shown in the multiplayer server list.',
        category: 'General',
        field: 'text',
    },
    {
        key: 'max-players',
        label: 'Maximum players',
        description: 'Player slots advertised by the server.',
        category: 'Players',
        field: 'number',
        min: 1,
        max: 2147483647,
    },
    {
        key: 'difficulty',
        label: 'Difficulty',
        description: 'World difficulty.',
        category: 'Gameplay',
        field: 'select',
        options: ['peaceful', 'easy', 'normal', 'hard'],
    },
    {
        key: 'gamemode',
        label: 'Game mode',
        description: 'Default mode for new players.',
        category: 'Gameplay',
        field: 'select',
        options: ['survival', 'creative', 'adventure', 'spectator'],
    },
    {
        key: 'pvp',
        label: 'Player combat',
        description: 'Allow players to damage each other.',
        category: 'Gameplay',
        field: 'boolean',
    },
    {
        key: 'online-mode',
        label: 'Online authentication',
        description: 'Verify players with Minecraft account services.',
        category: 'Security',
        field: 'boolean',
        warning: 'Disabling this allows unverified identities to join. Keep it enabled for public servers.',
    },
    {
        key: 'white-list',
        label: 'Allowlist',
        description: 'Require players to be on the allowlist.',
        category: 'Security',
        field: 'boolean',
        warning: 'Disabling this can allow anyone with the address to join.',
    },
    {
        key: 'view-distance',
        label: 'View distance',
        description: 'Maximum number of chunks sent to players.',
        category: 'Performance',
        field: 'number',
        min: 3,
        max: 32,
    },
    {
        key: 'simulation-distance',
        label: 'Simulation distance',
        description: 'Radius of actively simulated chunks.',
        category: 'Performance',
        field: 'number',
        min: 3,
        max: 32,
    },
    {
        key: 'spawn-protection',
        label: 'Spawn protection',
        description: 'Protected radius around world spawn.',
        category: 'World',
        field: 'number',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'allow-flight',
        label: 'Allow flight',
        description: 'Allow clients to fly without being kicked.',
        category: 'Gameplay',
        field: 'boolean',
    },
    {
        key: 'enable-command-block',
        label: 'Command blocks',
        description: 'Allow command blocks in the world.',
        category: 'Advanced',
        field: 'boolean',
        warning: 'Command blocks can run powerful commands. Restrict who can edit them.',
    },
    {
        key: 'server-port',
        label: 'Server port',
        description: 'Port used by the Minecraft server.',
        category: 'Network',
        field: 'number',
        min: 1,
        max: 65535,
        warning: 'This does not change the panel allocation. Keep the port aligned with the primary allocation.',
    },
    {
        key: 'enable-status',
        label: 'Server list status',
        description: 'Allow the server to answer status requests from multiplayer lists.',
        category: 'General',
        field: 'boolean',
    },
    {
        key: 'hide-online-players',
        label: 'Hide online players',
        description: 'Hide the player list in server status responses.',
        category: 'General',
        field: 'boolean',
    },
    {
        key: 'force-gamemode',
        label: 'Force game mode',
        description: 'Reset a player to the default game mode when they join.',
        category: 'Gameplay',
        field: 'boolean',
    },
    {
        key: 'hardcore',
        label: 'Hardcore mode',
        description: 'Make death and difficulty behave as hardcore mode.',
        category: 'Gameplay',
        field: 'boolean',
    },
    {
        key: 'generate-structures',
        label: 'Generate structures',
        description: 'Generate villages and other world structures.',
        category: 'World',
        field: 'boolean',
    },
    {
        key: 'level-name',
        label: 'World folder',
        description: 'Name of the world folder. Changing it can create a new world on restart.',
        category: 'World',
        field: 'text',
        warning: 'Check the existing world folder before changing this value.',
    },
    {
        key: 'level-seed',
        label: 'World seed',
        description: 'Seed used when a new world is generated.',
        category: 'World',
        field: 'text',
    },
    {
        key: 'level-type',
        label: 'World type',
        description: 'World generator identifier. Available values depend on the Minecraft version.',
        category: 'World',
        field: 'text',
    },
    {
        key: 'max-world-size',
        label: 'Maximum world size',
        description: 'Largest radius at which new chunks may be generated.',
        category: 'World',
        field: 'number',
        min: 1,
        max: 29999984,
    },
    {
        key: 'player-idle-timeout',
        label: 'Idle timeout',
        description: 'Minutes before an idle player is kicked; 0 disables the timeout.',
        category: 'Players',
        field: 'number',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'enforce-whitelist',
        label: 'Enforce allowlist',
        description: 'Disconnect players who are not on the allowlist when it changes.',
        category: 'Security',
        field: 'boolean',
    },
    {
        key: 'enforce-secure-profile',
        label: 'Secure player profiles',
        description: 'Require players to have a Mojang-signed public key.',
        category: 'Security',
        field: 'boolean',
    },
    {
        key: 'prevent-proxy-connections',
        label: 'Proxy connection checks',
        description: 'Reject connections when the player authentication network does not match.',
        category: 'Security',
        field: 'boolean',
    },
    {
        key: 'broadcast-console-to-ops',
        label: 'Console output to operators',
        description: 'Send console command output to in-game operators.',
        category: 'Security',
        field: 'boolean',
    },
    {
        key: 'broadcast-rcon-to-ops',
        label: 'RCON output to operators',
        description: 'Send RCON command output to in-game operators.',
        category: 'Security',
        field: 'boolean',
    },
    {
        key: 'log-ips',
        label: 'Log player IP addresses',
        description: 'Include player IP addresses in server logs.',
        category: 'Security',
        field: 'boolean',
    },
    {
        key: 'enable-query',
        label: 'Query protocol',
        description: 'Enable the GameSpy4 query listener.',
        category: 'Network',
        field: 'boolean',
    },
    {
        key: 'query.port',
        label: 'Query port',
        description: 'Port for the query listener when enabled.',
        category: 'Network',
        field: 'number',
        min: 1,
        max: 65535,
        warning: 'The port must have a matching panel allocation.',
    },
    {
        key: 'enable-rcon',
        label: 'RCON listener',
        description: 'Allow remote console connections.',
        category: 'Network',
        field: 'boolean',
        warning: 'Enable only with a strong RCON password and a private allocation.',
    },
    {
        key: 'rcon.port',
        label: 'RCON port',
        description: 'Port for remote console connections.',
        category: 'Network',
        field: 'number',
        min: 1,
        max: 65535,
        warning: 'The port must have a matching panel allocation.',
    },
    {
        key: 'server-ip',
        label: 'Bind address',
        description: 'Address the Minecraft server listens on; blank uses all available interfaces.',
        category: 'Network',
        field: 'text',
        warning: 'An incorrect bind address can prevent players from connecting.',
    },
    {
        key: 'network-compression-threshold',
        label: 'Compression threshold',
        description: 'Packet size in bytes before compression; a negative value disables it.',
        category: 'Network',
        field: 'number',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'rate-limit',
        label: 'Packet rate limit',
        description: 'Maximum packet rate before a player is kicked; 0 disables the limit.',
        category: 'Network',
        field: 'number',
        min: 0,
        max: 2147483647,
    },
    {
        key: 'use-native-transport',
        label: 'Native network transport',
        description: 'Use native transport on supported Linux systems.',
        category: 'Network',
        field: 'boolean',
    },
    {
        key: 'entity-broadcast-range-percentage',
        label: 'Entity broadcast range',
        description: 'Entity visibility range as a percentage of the default.',
        category: 'Performance',
        field: 'number',
        min: 10,
        max: 1000,
    },
    {
        key: 'max-tick-time',
        label: 'Watchdog tick time',
        description: 'Maximum milliseconds for one tick; -1 disables the watchdog.',
        category: 'Performance',
        field: 'number',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'pause-when-empty-seconds',
        label: 'Pause when empty',
        description: 'Seconds with no players before pausing; -1 disables it.',
        category: 'Performance',
        field: 'number',
        min: -1,
        max: 2147483647,
    },
    {
        key: 'sync-chunk-writes',
        label: 'Synchronous chunk writes',
        description: 'Request synchronous world chunk writes where supported.',
        category: 'Performance',
        field: 'boolean',
    },
    {
        key: 'max-chained-neighbor-updates',
        label: 'Neighbor update limit',
        description: 'Maximum chained neighbor updates; a negative value disables the limit.',
        category: 'Performance',
        field: 'number',
        min: -2147483648,
        max: 2147483647,
    },
    {
        key: 'op-permission-level',
        label: 'Operator permission level',
        description: 'Default command permission level granted by /op.',
        category: 'Advanced',
        field: 'select',
        options: ['0', '1', '2', '3', '4'],
    },
    {
        key: 'function-permission-level',
        label: 'Function permission level',
        description: 'Command permission level for functions.',
        category: 'Advanced',
        field: 'select',
        options: ['1', '2', '3', '4'],
    },
    {
        key: 'enable-jmx-monitoring',
        label: 'JMX monitoring',
        description: 'Expose server tick metrics to a configured local JMX runtime.',
        category: 'Advanced',
        field: 'boolean',
    },
    {
        key: 'debug',
        label: 'Debug output',
        description: 'Enable additional server diagnostics.',
        category: 'Advanced',
        field: 'boolean',
    },
    {
        key: 'require-resource-pack',
        label: 'Require resource pack',
        description: 'Disconnect players who decline the configured resource pack.',
        category: 'Advanced',
        field: 'boolean',
    },
];

export const PROPERTY_CATEGORIES: readonly PropertyCategory[] = [
    'General',
    'Gameplay',
    'World',
    'Players',
    'Network',
    'Security',
    'Performance',
    'Advanced',
];

export interface ParsedProperty {
    key: string;
    value: string;
    line: number;
    editable: boolean;
}

export interface ParsedProperties {
    properties: ParsedProperty[];
    warnings: string[];
}

const lines = (content: string): string[] =>
    content.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g)?.filter((part) => part !== '') ?? [];
const unescaped = (text: string, index: number): boolean => {
    let backslashes = 0;

    for (let position = index - 1; position >= 0 && text[position] === '\\'; position--) {
        backslashes++;
    }

    return backslashes % 2 === 0;
};

function decode(text: string): string | null {
    let result = '';

    for (let index = 0; index < text.length; index++) {
        if (text[index] !== '\\') {
            result += text[index];
            continue;
        }

        const next = text[++index];

        if (next === undefined) {
            return null;
        }

        if (next === 'u') {
            const digits = text.slice(index + 1, index + 5);

            if (!/^[0-9a-fA-F]{4}$/.test(digits)) {
                return null;
            }

            result += String.fromCharCode(parseInt(digits, 16));
            index += 4;
        } else {
            const escapes = { t: '\t', n: '\n', r: '\r', f: '\f' };

            result += next in escapes ? escapes[next as keyof typeof escapes] : next;
        }
    }

    return result;
}

// oxlint-disable-next-line complexity -- Java properties allow escaped separators and whitespace separators.
function splitLine(line: string): { prefix: string; key: string; value: string } | null {
    const body = line.replace(/\r\n$|[\r\n]$/, '');
    let start = 0;

    while (start < body.length && /[ \t\f]/.test(body[start])) {
        start++;
    }

    if (start === body.length || body[start] === '#' || body[start] === '!') {
        return null;
    }

    let end = start;

    while (end < body.length && !(unescaped(body, end) && /[=: \t\f]/.test(body[end]))) {
        end++;
    }

    if (end === start) {
        return null;
    }

    let valueStart = end;

    while (valueStart < body.length && /[ \t\f]/.test(body[valueStart])) {
        valueStart++;
    }

    if (body[valueStart] === '=' || body[valueStart] === ':') {
        valueStart++;
    }

    while (valueStart < body.length && /[ \t\f]/.test(body[valueStart])) {
        valueStart++;
    }

    const key = decode(body.slice(start, end));
    const value = decode(body.slice(valueStart));

    return key === null || value === null
        ? null
        : { prefix: end === body.length ? `${body}=` : body.slice(0, valueStart), key, value };
}

export function parseProperties(content: string): ParsedProperties {
    const source = lines(content);
    const properties: ParsedProperty[] = [];
    const warnings: string[] = [];
    let continued = false;

    for (const [index, fullLine] of source.entries()) {
        const body = fullLine.replace(/\r\n$|[\r\n]$/, '');
        const continuation = body.endsWith('\\') && unescaped(body, body.length - 1);

        if (continued || continuation) {
            warnings.push(`Line ${index + 1} uses a continuation; edit it in the raw file editor.`);
            continued = continuation;

            continue;
        }

        const trimmed = body.trimStart();

        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
            continue;
        }

        const parsed = splitLine(fullLine);

        if (!parsed) {
            warnings.push(`Line ${index + 1} could not be parsed; it will be preserved.`);

            continue;
        }

        properties.push({ key: parsed.key, value: parsed.value, line: index, editable: true });
    }

    const counts = new Map<string, number>();

    for (const { key } of properties) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    for (const property of properties) {
        if ((counts.get(property.key) ?? 0) > 1) {
            property.editable = false;
            warnings.push(
                `Duplicate ${property.key} on line ${property.line + 1}; edit duplicates in the raw file editor.`
            );
        }
    }

    return { properties, warnings };
}

function encode(value: string): string {
    return [...value]
        .map((character, index) => {
            if (character === '\\') {
                return '\\\\';
            }

            if (character === '\n') {
                return '\\n';
            }

            if (character === '\r') {
                return '\\r';
            }

            if (character === '\t') {
                return '\\t';
            }

            if (index === 0 && character === ' ') {
                return '\\ ';
            }

            if (character.charCodeAt(0) > 127) {
                return Array.from({ length: character.length }, (_, position) => character.charCodeAt(position))
                    .map((unit) => `\\u${unit.toString(16).padStart(4, '0')}`)
                    .join('');
            }

            return character;
        })
        .join('');
}

/** Replaces only selected value spans, preserving all other bytes and line endings. */
export function applyPropertyChanges(content: string, changes: Readonly<Record<string, string>>): string {
    const source = lines(content);
    const parsed = parseProperties(content);

    for (const property of parsed.properties) {
        if (!property.editable || !(property.key in changes) || changes[property.key] === property.value) {
            continue;
        }

        const original = source[property.line];
        const suffix = original.match(/\r\n$|[\r\n]$/)?.[0] ?? '';
        const parts = splitLine(original);

        if (parts) {
            source[property.line] = `${parts.prefix}${encode(changes[property.key])}${suffix}`;
        }
    }

    return source.join('');
}

// oxlint-disable-next-line complexity -- Validation covers all metadata-driven field types and bounds.
export function validateProperty(definition: PropertyDefinition, value: string): string | null {
    if (definition.field === 'boolean') {
        return value === 'true' || value === 'false' ? null : 'Choose enabled or disabled.';
    }

    if (definition.field === 'select') {
        return definition.options?.includes(value) ? null : 'Choose a listed value.';
    }

    if (definition.field === 'number') {
        if (!/^-?\d+$/.test(value)) {
            return 'Enter a whole number.';
        }

        const number = Number(value);

        if (
            !Number.isSafeInteger(number) ||
            number < (definition.min ?? -Infinity) ||
            number > (definition.max ?? Infinity)
        ) {
            return `Enter a value from ${definition.min ?? '-∞'} to ${definition.max ?? '∞'}.`;
        }
    }

    if (value.includes('\n') || value.includes('\r')) {
        return 'Use a single line.';
    }

    return null;
}
