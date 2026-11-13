import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, ChevronsDown, ChevronsRight, Copy, Expand, Search, SquareTerminal, Trash2 } from 'lucide-react';
import { Button, cn, SpinnerOverlay, toast } from '@/sdk';
import type { ServerConsoleCommand, ViewProps } from '@/sdk/theme';

const terminalContainerClass =
    'relative h-[min(58vh,620px)] min-h-[360px] flex-1 bg-terminal p-2 font-mono text-sm caret-transparent sm:min-h-[430px] sm:p-3';
const filterLabels = { all: 'All', warning: 'Warnings', error: 'Errors' };

function onCommandKey(command: ServerConsoleCommand, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        command.previous();
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        command.next();
    }

    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        command.submit();
    }
}

export default function Terminal({ model, className }: ViewProps<'server.terminal'>) {
    const { command, logs } = model;
    const fullscreen = useRef<HTMLDivElement>(null);
    const [searchOpen, setSearchOpen] = useState(false);

    const toggleSearch = () => {
        setSearchOpen(!searchOpen);

        if (searchOpen) {
            logs.setSearch('');
        }
    };

    const copyLogs = async () => {
        try {
            await navigator.clipboard.writeText(logs.text);
            toast.success('Visible console output copied');
        } catch {
            toast.error('Could not copy console output');
        }
    };

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement === fullscreen.current) {
                await document.exitFullscreen();
            } else {
                await fullscreen.current?.requestFullscreen();
            }
        } catch {
            toast.error('Fullscreen is unavailable in this browser');
        }
    };

    return (
        <div ref={fullscreen} className={cn('ibis-console-terminal relative flex w-full flex-col', className)}>
            <div className='ibis-console-title flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-sm text-foreground'>
                <span className='inline-flex items-center gap-2 font-semibold'>
                    <SquareTerminal size={16} aria-hidden /> Console
                </span>
                <span className='ibis-console-connection' data-tone={model.status.tone} role='status'>
                    <span aria-hidden /> {model.status.label}
                </span>
                <div
                    className='ibis-console-tools ml-auto flex flex-wrap items-center gap-1'
                    aria-label='Console controls'
                >
                    {(['all', 'warning', 'error'] as const).map((filter) => (
                        <button
                            key={filter}
                            type='button'
                            aria-label={`Show ${filter === 'all' ? 'all' : filter} logs`}
                            aria-pressed={logs.filter === filter}
                            onClick={() => logs.setFilter(filter)}
                            className='ibis-console-filter rounded-md px-2 py-1 text-xs'
                        >
                            {filterLabels[filter]}
                            <span className='ml-1 rounded-full bg-background/60 px-1.5'>{logs.counts[filter]}</span>
                        </button>
                    ))}
                    <button
                        type='button'
                        className='ibis-console-tool'
                        aria-label='Search console'
                        title='Search buffered console output'
                        aria-expanded={searchOpen}
                        onClick={toggleSearch}
                    >
                        <Search size={15} />
                    </button>
                    <button
                        type='button'
                        className='ibis-console-tool'
                        aria-label='Copy visible logs'
                        title='Copy the currently visible console output'
                        disabled={!logs.visible}
                        onClick={() => void copyLogs()}
                    >
                        <Copy size={15} />
                    </button>
                    <button
                        type='button'
                        className='ibis-console-tool'
                        aria-label='Clear visible console buffer'
                        title='Clear only this viewer’s buffered output; server files and Wings history are untouched'
                        disabled={!logs.counts.all}
                        onClick={logs.clear}
                    >
                        <Trash2 size={15} />
                    </button>
                    <button
                        type='button'
                        className='ibis-console-tool'
                        aria-label='Toggle console fullscreen'
                        title='Toggle console fullscreen'
                        onClick={() => void toggleFullscreen()}
                    >
                        <Expand size={15} />
                    </button>
                </div>
            </div>
            {searchOpen && (
                <div className='border-b border-border bg-card px-3 py-2'>
                    <input
                        autoFocus
                        type='search'
                        value={logs.search}
                        onChange={(event) => logs.setSearch(event.target.value)}
                        aria-label='Search buffered console output'
                        placeholder='Search visible logs...'
                        className='w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground'
                    />
                </div>
            )}
            <SpinnerOverlay visible={model.loading} size='large' />
            {model.failed && (
                <div
                    role='alert'
                    className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-sm bg-terminal p-4 text-center text-sm text-foreground'
                >
                    <p>The console could not be loaded.</p>
                    <Button.Text size='small' onClick={model.retry}>
                        Try again
                    </Button.Text>
                </div>
            )}
            <div className={cn(terminalContainerClass, !command.allowed && 'rounded-b-sm')}>
                <model.Terminal />
                {model.scrolledUp && (
                    <button
                        type='button'
                        onClick={model.scrollToBottom}
                        aria-label='Scroll to bottom'
                        className='absolute bottom-3 right-5 z-10 rounded-full bg-popover/90 p-2 text-foreground shadow-lg transition-colors hover:bg-popover'
                    >
                        <ChevronsDown className='h-4 w-4' />
                    </button>
                )}
            </div>
            {command.allowed && (
                <div className='ibis-console-command flex items-center gap-2 border-t border-border bg-card p-2'>
                    <ChevronsRight size={16} aria-hidden className='shrink-0 text-primary' />
                    <input
                        className='min-w-0 flex-1 rounded-md border border-border bg-terminal px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary'
                        type='text'
                        placeholder='Type a command...'
                        aria-label='Console command input.'
                        disabled={command.disabled}
                        value={command.value}
                        onChange={(event) => command.setValue(event.currentTarget.value)}
                        onKeyDown={(event) => onCommandKey(command, event)}
                        autoCorrect='off'
                        autoCapitalize='none'
                    />
                    <button
                        type='button'
                        aria-label='Send console command'
                        title='Send command'
                        onClick={command.submit}
                        disabled={command.disabled || !command.value.trim()}
                        className='ibis-console-send rounded-md bg-primary p-2 text-primary-foreground disabled:opacity-40'
                    >
                        <ArrowRight size={18} aria-hidden />
                    </button>
                </div>
            )}
        </div>
    );
}
