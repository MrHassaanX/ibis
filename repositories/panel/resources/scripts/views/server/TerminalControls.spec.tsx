/** @vitest-environment jsdom */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ConsoleLogBuffer, type ConsoleLogFilter } from '@/components/server/console/ConsoleLogBuffer';
import type { ServerTerminalModel } from '@/views/server/console';
import Terminal from '@/themes/classic/views/server/console/Terminal';

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it('filters, searches, copies and clears only viewer-local buffered output', async () => {
    const buffer = new ConsoleLogBuffer();

    buffer.append('[12:00 INFO]: ready');
    buffer.append('[12:01 WARN]: slow');
    buffer.append('[12:02 ERROR]: failed');
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    function Harness() {
        const [filter, setFilter] = useState<ConsoleLogFilter>('all');
        const [search, setSearch] = useState('');
        const [, refresh] = useState(0);
        const visible = buffer.visible(filter, search);
        const model: ServerTerminalModel = {
            Terminal: () => <div data-testid='terminal-canvas' />,
            loading: false,
            failed: false,
            retry: vi.fn(),
            scrolledUp: false,
            scrollToBottom: vi.fn(),
            connected: true,
            status: { label: 'Connected', tone: 'success' },
            command: {
                allowed: false,
                disabled: true,
                value: '',
                history: [],
                setValue: vi.fn(),
                previous: vi.fn(),
                next: vi.fn(),
                submit: vi.fn(),
            },
            logs: {
                filter,
                search,
                counts: buffer.counts(),
                visible: visible.length,
                text: visible.map((entry) => entry.plain).join('\n'),
                setFilter,
                setSearch,
                clear: () => {
                    buffer.clear();
                    refresh((value) => value + 1);
                },
            },
        };

        return <Terminal model={model} Default={() => null} />;
    }

    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Show all logs' })).toHaveTextContent('3');
    fireEvent.click(screen.getByRole('button', { name: 'Show warning logs' }));
    expect(screen.getByRole('button', { name: 'Show warning logs' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Copy visible logs' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('[12:01 WARN]: slow'));

    fireEvent.click(screen.getByRole('button', { name: 'Search console' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search buffered console output' }), {
        target: { value: 'missing' },
    });
    expect(screen.getByRole('button', { name: 'Copy visible logs' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear visible console buffer' }));
    expect(buffer.counts().all).toBe(0);
    expect(screen.getByRole('button', { name: 'Clear visible console buffer' })).toBeDisabled();
});
