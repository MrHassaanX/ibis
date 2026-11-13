import { useState } from 'react';
import { Button, Dialog, http, httpErrorToHuman, NewButton, useCurrentServerUuid } from '@/sdk';
import type { FileManagerModel } from '@/sdk/theme';

interface Repository {
    owner: string;
    repository: string;
    default_branch: string;
    branches: { name: string; sha: string }[];
}

interface ImportResult {
    commit: string;
    files: number;
    bytes: number;
    package_lock: boolean;
    manifest: { dependencies?: Record<string, string>; scripts?: Record<string, string> } | null;
}

function RepositoryOptions({
    repository,
    branch,
    setBranch,
    destination,
    setDestination,
    busy,
    onImport,
}: {
    repository: Repository;
    branch: string;
    setBranch: (value: string) => void;
    destination: string;
    setDestination: (value: string) => void;
    busy: boolean;
    onImport: () => void;
}) {
    return (
        <>
            <p>
                <strong>
                    {repository.owner}/{repository.repository}
                </strong>{' '}
                · Public GitHub repository
            </p>
            <label className='block'>
                Branch
                <select
                    className='mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    disabled={busy}
                >
                    {repository.branches.map((item) => (
                        <option key={item.sha} value={item.name}>
                            {item.name}
                            {item.name === repository.default_branch ? ' (default)' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <p className='break-all text-muted-foreground'>
                Resolved commit: {repository.branches.find((item) => item.name === branch)?.sha}
            </p>
            <label className='block'>
                New directory in server root
                <input
                    className='mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    disabled={busy}
                    maxLength={101}
                />
            </label>
            <p className='text-muted-foreground'>
                The directory must not exist. The snapshot will be placed directly inside /home/container/
                {destination || '…'}.
            </p>
            <Button onClick={onImport} disabled={busy || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(destination)}>
                Import snapshot
            </Button>
        </>
    );
}

function ImportSuccess({
    result,
    destination,
    onClose,
}: {
    result: ImportResult;
    destination: string;
    onClose: () => void;
}) {
    const scripts = result.manifest?.scripts;
    const next = Boolean(result.manifest?.dependencies?.next);

    return (
        <div role='status' className='space-y-2'>
            <p>
                Complete: {result.files} files imported into /{destination} ({result.bytes.toLocaleString()} bytes).
            </p>
            <p className='break-all'>Commit: {result.commit}</p>
            {result.manifest && (
                <div className='rounded-md border border-border p-3'>
                    <strong>{next ? 'Next.js' : 'Node.js'} project detected</strong>
                    <p>
                        {result.package_lock
                            ? 'npm lockfile found. Suggested: npm ci'
                            : 'No npm lockfile found. Review dependencies before installing.'}
                    </p>
                    {scripts && <p>Scripts: {Object.keys(scripts).join(', ') || 'none'}</p>}
                    {next && <p>Suggested build: npm run build. Suggested production start: npm run start.</p>}
                    <p>
                        No dependencies were installed and no build ran. Use a suitable isolated Node.js server workflow
                        to run these commands after reviewing the code.
                    </p>
                </div>
            )}
            <Button onClick={onClose}>Close</Button>
        </div>
    );
}

function ImportForm({ model, onClose }: { model: FileManagerModel; onClose: () => void }) {
    const uuid = useCurrentServerUuid();
    const [url, setUrl] = useState('');
    const [repository, setRepository] = useState<Repository>();
    const [branch, setBranch] = useState('');
    const [destination, setDestination] = useState('');
    const [stage, setStage] = useState<'idle' | 'validating' | 'importing' | 'complete' | 'failed'>('idle');
    const [error, setError] = useState('');
    const [result, setResult] = useState<ImportResult>();

    const verify = async () => {
        if (!uuid) {
            return;
        }

        setStage('validating');
        setError('');
        setRepository(undefined);
        try {
            const response = await http.post<Repository>(`/api/client/servers/${uuid}/files/git/inspect`, { url });

            setRepository(response.data);
            setBranch(response.data.default_branch);
            setDestination(response.data.repository.toLowerCase());
            setStage('idle');
        } catch (cause) {
            setError(httpErrorToHuman(cause));
            setStage('failed');
        }
    };

    const importSnapshot = async () => {
        if (!uuid || !repository) {
            return;
        }

        setStage('importing');
        setError('');
        try {
            const response = await http.post<ImportResult>(
                `/api/client/servers/${uuid}/files/git/import`,
                { url, branch, destination },
                { timeout: 300000 }
            );

            setResult(response.data);
            setStage('complete');
            if (model.directory === '/') {
                await model.actions.refresh();
            }
        } catch (cause) {
            setError(httpErrorToHuman(cause));
            setStage('failed');
        }
    };

    const busy = stage === 'validating' || stage === 'importing';

    return (
        <Dialog
            open
            onClose={onClose}
            title='Import from Git'
            description='Import a snapshot of a public GitHub repository. No code will run and Git history is not included.'
            preventExternalClose={busy}
            hideCloseIcon={busy}
        >
            <div className='space-y-4 text-sm'>
                <label className='block'>
                    Repository URL
                    <input
                        className='mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
                        type='url'
                        value={url}
                        onChange={(event) => {
                            setUrl(event.target.value);
                            setRepository(undefined);
                            setResult(undefined);
                        }}
                        placeholder='https://github.com/owner/repository'
                        disabled={busy || stage === 'complete'}
                    />
                </label>
                {!repository && (
                    <Button onClick={verify} disabled={!url || busy}>
                        {stage === 'validating' ? 'Validating…' : 'Verify repository'}
                    </Button>
                )}
                {repository && stage !== 'complete' && (
                    <RepositoryOptions
                        repository={repository}
                        branch={branch}
                        setBranch={setBranch}
                        destination={destination}
                        setDestination={setDestination}
                        busy={busy}
                        onImport={importSnapshot}
                    />
                )}
                {stage === 'importing' && (
                    <p role='status'>
                        Downloading and validating the archive, then importing files through Wings. This may take a few
                        minutes. Keep this dialog open.
                    </p>
                )}
                {error && (
                    <p role='alert' className='text-destructive'>
                        Import failed: {error}
                    </p>
                )}
                {result && <ImportSuccess result={result} destination={destination} onClose={onClose} />}
            </div>
        </Dialog>
    );
}

export function ImportFromGitButton({ model }: { model: FileManagerModel }) {
    const [open, setOpen] = useState(false);

    if (!model.permissions.create || !model.permissions.delete) {
        return null;
    }

    return (
        <>
            <NewButton onClick={() => setOpen(true)}>Import from Git</NewButton>
            {open && <ImportForm model={model} onClose={() => setOpen(false)} />}
        </>
    );
}
