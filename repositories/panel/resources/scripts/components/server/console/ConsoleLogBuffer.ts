export type ConsoleLogFilter = 'all' | 'warning' | 'error';
export type ConsoleLogLevel = 'info' | 'warning' | 'error';

export interface ConsoleLogEntry {
    readonly raw: string;
    readonly plain: string;
    readonly level: ConsoleLogLevel;
}

const MAX_LINES = 2_000;
const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
const BRACKETED_LEVEL = /\[[^\]]*\b(WARN(?:ING)?|ERROR|ERR|SEVERE|FATAL)\b[^\]]*\]/i;
const LEADING_LEVEL = /^\s*(?:WARN(?:ING)?|ERROR|ERR|SEVERE|FATAL)(?=\s|:|\]|$)/i;

export const plainConsoleLine = (raw: string): string => raw.replaceAll(ANSI_ESCAPE, '').replaceAll('\r', '');

function lineLevel(plain: string, previous: ConsoleLogLevel): ConsoleLogLevel {
    const match = BRACKETED_LEVEL.exec(plain) ?? LEADING_LEVEL.exec(plain);

    if (match) {
        const token = (match[1] ?? match[0]).toUpperCase();

        return token.startsWith('WARN') ? 'warning' : 'error';
    }

    return /^\s+(?:at\s|Caused by:|\.\.\.|\S)/.test(plain) ? previous : 'info';
}

/** Bounded, viewer-local Wings output. Its entries never modify server files or daemon history. */
export class ConsoleLogBuffer {
    private entries: ConsoleLogEntry[] = [];

    append(chunk: string, forcedLevel?: ConsoleLogLevel): ConsoleLogEntry[] {
        const added: ConsoleLogEntry[] = [];

        for (const raw of chunk.split(/\r?\n/)) {
            if (!raw && added.length > 0) {
                continue;
            }

            const plain = plainConsoleLine(raw);
            const previous = this.entries.at(-1)?.level ?? 'info';
            const entry = { raw, plain, level: forcedLevel ?? lineLevel(plain, previous) };

            this.entries.push(entry);
            added.push(entry);
        }

        if (this.entries.length > MAX_LINES) {
            this.entries.splice(0, this.entries.length - MAX_LINES);
        }

        return added;
    }

    clear(): void {
        this.entries = [];
    }

    counts() {
        return {
            all: this.entries.length,
            warning: this.entries.filter((entry) => entry.level === 'warning').length,
            error: this.entries.filter((entry) => entry.level === 'error').length,
        };
    }

    visible(filter: ConsoleLogFilter, search: string): readonly ConsoleLogEntry[] {
        const query = search.trim().toLocaleLowerCase();

        return this.entries.filter(
            (entry) =>
                (filter === 'all' || entry.level === filter) &&
                (!query || entry.plain.toLocaleLowerCase().includes(query))
        );
    }
}
