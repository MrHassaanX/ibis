import { describe, expect, it } from 'vitest';
import { applyPropertyChanges, parseProperties, PROPERTY_DEFINITIONS, validateProperty } from './minecraftProperties';

describe('Java properties editing', () => {
    it('preserves comments, unknown keys, spacing, Unicode escapes and CRLF around an edit', () => {
        const source = '# Keep me\r\n\r\ncustom\\:key = value\\u263a\r\n  motd : Old\\ World\r\nunknown=one\r\n';

        expect(parseProperties(source).properties.map(({ key, value }) => [key, value])).toEqual([
            ['custom:key', 'value☺'],
            ['motd', 'Old World'],
            ['unknown', 'one'],
        ]);
        expect(applyPropertyChanges(source, { motd: 'New world' })).toBe(
            '# Keep me\r\n\r\ncustom\\:key = value\\u263a\r\n  motd : New world\r\nunknown=one\r\n'
        );
        expect(applyPropertyChanges(source, { motd: 'Old World' })).toBe(source);
    });

    it('preserves LF, empty values, escaped separators, backslashes and non-ASCII on round trip', () => {
        const source = 'motd=\nkey\\=with\\:separators=path\\\\name\n';

        expect(parseProperties(source).properties.map(({ key, value }) => [key, value])).toEqual([
            ['motd', ''],
            ['key=with:separators', 'path\\name'],
        ]);
        const saved = applyPropertyChanges(source, { motd: 'Welcome ☺' });

        expect(saved).toBe('motd=Welcome \\u263a\nkey\\=with\\:separators=path\\\\name\n');
        expect(parseProperties(saved).properties[0].value).toBe('Welcome ☺');
    });

    it('leaves duplicate, continued and malformed lines for the raw editor', () => {
        const source = 'motd=first\nmotd=second\nmax-players=10\\\n  0\n=value\n';
        const parsed = parseProperties(source);

        expect(parsed.properties.filter(({ key }) => key === 'motd').every(({ editable }) => !editable)).toBe(true);
        expect(parsed.warnings).toEqual(
            expect.arrayContaining([
                expect.stringContaining('Duplicate'),
                expect.stringContaining('continuation'),
                expect.stringContaining('could not be parsed'),
            ])
        );
        expect(applyPropertyChanges(source, { motd: 'replacement', 'max-players': '20' })).toBe(source);
    });

    it('validates known values while keeping the registry separate from rendering', () => {
        const find = (key: string) => PROPERTY_DEFINITIONS.find((entry) => entry.key === key)!;

        expect(validateProperty(find('max-players'), '0')).toMatch(/from 1/);
        expect(validateProperty(find('server-port'), '65536')).toMatch(/to 65535/);
        expect(validateProperty(find('online-mode'), 'maybe')).toBeTruthy();
        expect(validateProperty(find('motd'), 'line\nbreak')).toBeTruthy();
        expect(validateProperty(find('difficulty'), 'hard')).toBeNull();
        expect(validateProperty(find('view-distance'), '2')).toMatch(/from 3/);
        expect(validateProperty(find('entity-broadcast-range-percentage'), '1001')).toBeTruthy();
        expect(validateProperty(find('op-permission-level'), '5')).toBeTruthy();
        expect(validateProperty(find('pause-when-empty-seconds'), '-1')).toBeNull();
    });

    it('exposes common Java settings while leaving version-specific and secret keys in the raw file', () => {
        const keys = new Set(PROPERTY_DEFINITIONS.map(({ key }) => key));

        expect(keys.size).toBeGreaterThan(40);
        for (const key of ['enable-status', 'level-name', 'enable-query', 'enforce-secure-profile', 'max-tick-time']) {
            expect(keys.has(key)).toBe(true);
        }

        expect(keys.has('management-server-secret')).toBe(false);
        expect(keys.has('rcon.password')).toBe(false);
        const content = '# keep formatting\r\nmanagement-server-secret=private\r\nmax-tick-time = 60000\r\n';

        expect(applyPropertyChanges(content, { 'max-tick-time': '30000' })).toBe(
            '# keep formatting\r\nmanagement-server-secret=private\r\nmax-tick-time = 30000\r\n'
        );
    });
});
