import type { UseQueryResult } from '@tanstack/react-query';
import { Package, Search } from 'lucide-react';
import { httpErrorToHuman } from '@/api/http';
import {
    type ContentHit,
    type ContentRelease,
    type ManagedContent,
    type projectVersions,
    type searchContent,
} from '@/api/server/minecraftContent';
import Button from '@/components/elements/Button';
import Card from '@/components/elements/Card';

type QueryState<T> = Pick<UseQueryResult<T, Error>, 'data' | 'error' | 'isLoading'>;
type CatalogData = Awaited<ReturnType<typeof searchContent>>;
type ProjectData = Awaited<ReturnType<typeof projectVersions>>;
const inputClass =
    'w-full min-h-10 rounded-md border border-input-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

function QueryFeedback({
    loading,
    error,
    empty,
    emptyMessage,
}: {
    loading: boolean;
    error: Error | null;
    empty: boolean;
    emptyMessage: string;
}) {
    if (loading) {
        return <p className='text-sm text-muted-foreground'>Loading…</p>;
    }

    if (error) {
        return (
            <p role='alert' className='text-sm text-destructive'>
                {httpErrorToHuman(error)}
            </p>
        );
    }

    return empty ? <p className='text-sm text-muted-foreground'>{emptyMessage}</p> : null;
}

function ProjectIcon({ hit }: { hit: ContentHit }) {
    return hit.icon_url?.startsWith('https://cdn.modrinth.com/') ? (
        <img src={hit.icon_url} alt='' className='h-12 w-12 rounded-md object-cover' loading='lazy' />
    ) : (
        <div className='flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary'>
            <Package size={22} />
        </div>
    );
}

function actionLabel(managed: ManagedContent | undefined): string {
    if (!managed) {
        return 'Install';
    }

    if (managed.can_retry) {
        return 'Retry';
    }

    if (['queued', 'downloading', 'verifying', 'installing'].includes(managed.state)) {
        return 'Installing…';
    }

    if (managed.state !== 'installed') {
        return 'Install';
    }

    return managed.update_available ? 'Update' : 'Installed';
}

function managedActionLabel(item: ManagedContent): string {
    if (item.can_retry) {
        return 'Review retry';
    }

    if (item.update_available) {
        return 'Update';
    }

    return 'View releases';
}

function releaseActionLabel(item: ManagedContent | undefined): string {
    if (item?.can_retry) {
        return 'Retry installation';
    }

    if (item) {
        return 'Update managed jar';
    }

    return 'Install jar';
}

export function CatalogPanel({
    active,
    title,
    search,
    onSearch,
    offset,
    onOffset,
    catalog,
    installed,
    onProject,
}: {
    active: boolean;
    title: string;
    search: string;
    onSearch: (value: string) => void;
    offset: number;
    onOffset: (value: number) => void;
    catalog: QueryState<CatalogData>;
    installed: ManagedContent[];
    onProject: (id: string, trigger: HTMLButtonElement, hit?: ContentHit) => void;
}) {
    if (!active) {
        return null;
    }

    return (
        <Card title='Browse compatible projects'>
            <div className='space-y-4'>
                <label className='block'>
                    <span className='mb-2 block text-sm'>Search Modrinth</span>
                    <span className='relative block'>
                        <Search size={16} className='absolute left-3 top-3 text-muted-foreground' />
                        <input
                            className={`${inputClass} pl-9`}
                            value={search}
                            onChange={(event) => onSearch(event.target.value)}
                            placeholder={`Search ${title.toLowerCase()}…`}
                        />
                    </span>
                </label>
                <QueryFeedback
                    loading={catalog.isLoading}
                    error={catalog.error}
                    empty={catalog.data?.hits.length === 0}
                    emptyMessage='No compatible projects found.'
                />
                <div className='grid gap-3 md:grid-cols-2'>
                    {catalog.data?.hits.map((hit) => (
                        <div
                            key={hit.id}
                            className='flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-border p-3 sm:flex-nowrap'
                        >
                            <ProjectIcon hit={hit} />
                            <span className='min-w-0 flex-1'>
                                <strong className='block truncate'>{hit.title}</strong>
                                <span className='block text-xs text-muted-foreground'>by {hit.author}</span>
                                <span className='mt-1 block line-clamp-2 text-sm text-muted-foreground'>
                                    {hit.description}
                                </span>
                            </span>
                            {(() => {
                                const managed = installed.find((item) => item.project_id === hit.id);
                                const inProgress =
                                    managed &&
                                    !managed.can_retry &&
                                    ['queued', 'downloading', 'verifying', 'installing'].includes(managed.state);

                                return (
                                    <Button
                                        type='button'
                                        className='w-full shrink-0 sm:w-auto'
                                        isSecondary={Boolean(managed && !managed.update_available)}
                                        disabled={Boolean(
                                            inProgress || (managed?.state === 'installed' && !managed.update_available)
                                        )}
                                        onClick={(event) => onProject(hit.id, event.currentTarget, hit)}
                                    >
                                        {actionLabel(managed)}
                                    </Button>
                                );
                            })()}
                        </div>
                    ))}
                </div>
                {catalog.data && catalog.data.total > 20 && (
                    <div className='flex items-center justify-between gap-3'>
                        <Button isSecondary disabled={offset === 0} onClick={() => onOffset(Math.max(0, offset - 20))}>
                            Previous
                        </Button>
                        <span className='text-xs text-muted-foreground'>
                            {offset + 1}–{Math.min(offset + 20, catalog.data.total)} of {catalog.data.total}
                        </span>
                        <Button
                            isSecondary
                            disabled={offset + 20 >= catalog.data.total}
                            onClick={() => onOffset(offset + 20)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}

export function ManagedPanel({
    active,
    title,
    installed,
    canDelete,
    busy,
    onProject,
    onRemove,
}: {
    active: boolean;
    title: string;
    installed: QueryState<ManagedContent[]>;
    canDelete: boolean;
    busy: boolean;
    onProject: (id: string, trigger: HTMLButtonElement) => void;
    onRemove: (item: ManagedContent) => void;
}) {
    if (!active) {
        return null;
    }

    return (
        <Card title='Managed installations'>
            <QueryFeedback
                loading={installed.isLoading}
                error={installed.error}
                empty={installed.data?.length === 0}
                emptyMessage={`No ${title.toLowerCase()} installed through IbisPanel yet. Manually uploaded jars remain in Files.`}
            />
            <div className='divide-y divide-border'>
                {installed.data?.map((item) => (
                    <div key={item.id} className='flex flex-wrap items-center justify-between gap-3 py-3'>
                        <div className='min-w-0'>
                            <strong className='block break-all'>{item.filename}</strong>
                            <span className='text-xs text-muted-foreground'>
                                Modrinth {item.project_id} ·{' '}
                                {item.display_state === 'worker_unavailable'
                                    ? 'Queued (content worker unavailable)'
                                    : item.display_state}
                                {' · Updated '}
                                {new Date(item.updated_at).toLocaleString()}
                            </span>
                            {item.display_state === 'stalled' && (
                                <p role='alert' className='text-xs text-warning'>
                                    This install stopped updating. Review the release and retry while the server is
                                    stopped.
                                </p>
                            )}
                            {item.display_state === 'worker_unavailable' && (
                                <p role='status' className='text-xs text-warning'>
                                    The dedicated content worker is offline. An operator must start it before this
                                    install can run.
                                </p>
                            )}
                            {item.file_status === 'missing_or_changed' && (
                                <p role='alert' className='text-xs text-warning'>
                                    The tracked jar is missing or changed; updates and removal are blocked until it is
                                    reviewed in Files.
                                </p>
                            )}
                            {item.error && (
                                <p role='alert' className='text-xs text-destructive'>
                                    {item.error}
                                </p>
                            )}
                            {item.update_available && (
                                <p className='text-xs text-primary'>Compatible update available</p>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <Button isSecondary onClick={(event) => onProject(item.project_id, event.currentTarget)}>
                                {managedActionLabel(item)}
                            </Button>
                            {['installed', 'failed'].includes(item.state) &&
                                item.sha512 &&
                                item.file_status === 'verified' &&
                                canDelete && (
                                    <Button color='red' isSecondary disabled={busy} onClick={() => onRemove(item)}>
                                        Remove
                                    </Button>
                                )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function ReleaseReview({
    release,
    acknowledged,
    onAcknowledged,
    busy,
    canCreate,
    canUpdate,
    canDelete,
    installed,
    versionId,
    onInstall,
}: {
    release: QueryState<ContentRelease>;
    acknowledged: boolean;
    onAcknowledged: (value: boolean) => void;
    busy: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    installed: ManagedContent | undefined;
    versionId: string;
    onInstall: () => void;
}) {
    const blocked =
        !acknowledged ||
        busy ||
        !canCreate ||
        (installed !== undefined &&
            (!canUpdate ||
                !canDelete ||
                installed.file_status === 'missing_or_changed' ||
                (installed.state === 'installed' && installed.version_id === versionId)));

    return (
        <div className='mt-5 rounded-md border border-border p-4'>
            <QueryFeedback loading={release.isLoading} error={release.error} empty={false} emptyMessage='' />
            {release.data && (
                <div className='space-y-3 text-sm'>
                    <h3 className='font-semibold'>Review {release.data.version.name}</h3>
                    <p>Release channel: {release.data.version.channel}</p>
                    <p>
                        License: {release.data.project.license} · File: {release.data.file.name} · Size:{' '}
                        {release.data.file.size === null
                            ? 'Unknown'
                            : `${(release.data.file.size / 1024 / 1024).toFixed(1)} MiB`}
                    </p>
                    <p className='break-all text-xs text-muted-foreground'>
                        SHA-512: {release.data.file.sha512 ?? 'Unavailable'}
                    </p>
                    {release.data.dependencies
                        .filter((dependency) => dependency.type === 'required')
                        .map((dependency) => (
                            <p
                                key={`${dependency.project_id ?? ''}:${dependency.version_id ?? ''}`}
                                className='text-warning'
                            >
                                Required dependency: {dependency.project_id ?? dependency.version_id ?? 'unknown'}{' '}
                                (install separately first)
                            </p>
                        ))}
                    <label className='flex items-start gap-2'>
                        <input
                            type='checkbox'
                            checked={acknowledged}
                            onChange={(event) => onAcknowledged(event.target.checked)}
                        />
                        <span>
                            I reviewed this third-party release. It can execute code inside my Minecraft server.
                        </span>
                    </label>
                    <Button disabled={blocked} isLoading={busy} onClick={onInstall}>
                        {releaseActionLabel(installed)}
                    </Button>
                    <p className='text-xs text-muted-foreground'>
                        The server must be stopped. IbisPanel verifies the download and existing managed file before
                        replacing it.
                    </p>
                </div>
            )}
        </div>
    );
}

export function ProjectPanel({
    active,
    project,
    release,
    installed,
    versionId,
    onVersion,
    profile,
    author,
    onCancel,
    acknowledged,
    onAcknowledged,
    busy,
    canCreate,
    canUpdate,
    canDelete,
    onInstall,
}: {
    active: boolean;
    project: QueryState<ProjectData>;
    release: QueryState<ContentRelease>;
    installed: ManagedContent | undefined;
    versionId: string | null;
    onVersion: (id: string) => void;
    profile: { software: string; minecraft_version: string; loader_version: string | null } | null;
    author: string | null;
    onCancel: () => void;
    acknowledged: boolean;
    onAcknowledged: (value: boolean) => void;
    busy: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    onInstall: () => void;
}) {
    if (!active) {
        return null;
    }

    return (
        <div className='space-y-3'>
            <QueryFeedback
                loading={project.isLoading}
                error={project.error}
                empty={project.data?.versions.length === 0}
                emptyMessage='No release matches this server’s verified software and Minecraft version.'
            />
            {project.data && (
                <div className='flex items-start gap-3'>
                    {project.data.project.icon_url?.startsWith('https://cdn.modrinth.com/') && (
                        <img src={project.data.project.icon_url} alt='' className='h-12 w-12 rounded-md object-cover' />
                    )}
                    <p className='text-sm text-muted-foreground'>
                        {project.data.project.description} · License: {project.data.project.license}
                    </p>
                </div>
            )}
            {author && <p className='text-sm text-muted-foreground'>by {author}</p>}
            {profile && (
                <p className='text-sm'>
                    Server: Minecraft {profile.minecraft_version} · {profile.software}
                    {profile.loader_version ? ` ${profile.loader_version}` : ''}
                </p>
            )}
            {installed?.update_available && <p className='mb-3 text-sm text-primary'>Compatible update available</p>}
            <div className='grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2'>
                {project.data?.versions.map((version) => (
                    <button
                        key={version.id}
                        type='button'
                        onClick={() => onVersion(version.id)}
                        className={`rounded-md border p-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary ${versionId === version.id ? 'border-primary' : 'border-border'}`}
                    >
                        <strong className='block'>{version.name}</strong>
                        <span className='text-xs text-muted-foreground'>
                            {version.version_type} · {version.version_number}
                        </span>
                        {installed?.version_id === version.id && (
                            <span className='ml-2 text-xs text-primary'>Installed</span>
                        )}
                    </button>
                ))}
            </div>
            {versionId && (
                <ReleaseReview
                    release={release}
                    acknowledged={acknowledged}
                    onAcknowledged={onAcknowledged}
                    busy={busy}
                    canCreate={canCreate}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    installed={installed}
                    versionId={versionId}
                    onInstall={onInstall}
                />
            )}
            <Button type='button' isSecondary disabled={busy} onClick={onCancel}>
                Cancel
            </Button>
        </div>
    );
}
