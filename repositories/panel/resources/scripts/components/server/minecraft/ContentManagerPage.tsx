import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { httpErrorToHuman } from '@/api/http';
import {
    installContent,
    installedContent,
    projectVersions,
    releaseDetails,
    removeContent,
    searchContent,
    type ContentType,
    type ContentHit,
    type ManagedContent,
} from '@/api/server/minecraftContent';
import { useCurrentServer } from '@/api/server/queries';
import Button from '@/components/elements/Button';
import { Dialog } from '@/components/elements/dialog';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { getMinecraftProfile } from '@/api/server/minecraftProfile';
import { usePermissions } from '@/plugins/usePermissions';
import { CatalogPanel, ManagedPanel, ProjectPanel } from './ContentManagerPanels';

// The page coordinates independent catalog, profile, release and installation queries.
// eslint-disable-next-line complexity
export default function ContentManagerPage({ type }: { type: ContentType }) {
    const server = useCurrentServer();
    const uuid = server?.attributes.uuid ?? '';
    const [canRead, canCreate, canUpdate, canDelete] = usePermissions([
        'file.read',
        'file.create',
        'file.update',
        'file.delete',
    ]);
    const [tab, setTab] = useState<'catalog' | 'installed'>('catalog');
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    const [offset, setOffset] = useState(0);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [versionId, setVersionId] = useState<string | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [pendingRemove, setPendingRemove] = useState<number | null>(null);
    const [selectedHit, setSelectedHit] = useState<ContentHit | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const queryClient = useQueryClient();
    const title = type === 'plugin' ? 'Plugins' : 'Mods';
    const installedKey = ['minecraft-content', uuid, type, 'installed'];

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setTerm(search.trim());
            setOffset(0);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search]);

    const catalog = useQuery({
        queryKey: ['minecraft-content', uuid, type, 'catalog', term, offset],
        queryFn: () => searchContent(uuid, type, term, offset),
        enabled: !!uuid && canRead,
        retry: false,
    });
    const installed = useQuery({
        queryKey: installedKey,
        queryFn: () => installedContent(uuid, type),
        enabled: !!uuid && canRead,
        retry: false,
        refetchInterval: (query) =>
            query.state.data?.some((item) => ['queued', 'downloading', 'verifying', 'installing'].includes(item.state))
                ? 2000
                : false,
    });
    const profile = useQuery({
        queryKey: ['minecraft-profile', uuid],
        queryFn: () => getMinecraftProfile(uuid),
        enabled: !!uuid && canRead,
    });
    const project = useQuery({
        queryKey: ['minecraft-content', uuid, type, 'project', projectId],
        queryFn: () => projectVersions(uuid, type, projectId!),
        enabled: !!uuid && !!projectId && canRead,
        retry: false,
    });
    const release = useQuery({
        queryKey: ['minecraft-content', uuid, type, 'release', projectId, versionId],
        queryFn: () => releaseDetails(uuid, type, projectId!, versionId!),
        enabled: !!uuid && !!projectId && !!versionId && canRead,
        retry: false,
    });

    const selectedInstalled = installed.data?.find((item) => item.project_id === projectId);
    const chooseProject = (id: string, trigger: HTMLButtonElement, hit?: ContentHit) => {
        triggerRef.current = trigger;
        setSelectedHit(hit ?? null);
        setProjectId(id);
        setVersionId(null);
        setAcknowledged(false);
        setMessage(null);
    };

    const closeProject = () => {
        if (busy) {
            return;
        }

        setProjectId(null);
        setSelectedHit(null);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
    };

    useEffect(() => {
        if (!projectId || versionId || !project.data?.versions.length) {
            return;
        }

        const compatible = [...project.data.versions].sort((a, b) =>
            (b.date_published ?? '').localeCompare(a.date_published ?? '')
        );

        setVersionId(
            selectedInstalled?.update_available && selectedInstalled.latest_version_id
                ? selectedInstalled.latest_version_id
                : compatible[0].id
        );
    }, [projectId, project.data, versionId, selectedInstalled?.update_available, selectedInstalled?.latest_version_id]);

    const refreshInstalled = async () => {
        await queryClient.invalidateQueries({ queryKey: installedKey });
    };

    const install = async () => {
        if (!projectId || !versionId || !acknowledged || busy) {
            return;
        }

        setBusy(true);
        setMessage(null);
        try {
            await installContent(uuid, type, projectId, versionId);
            await refreshInstalled();
            setTab('installed');
            setProjectId(null);
            setSelectedHit(null);
            window.requestAnimationFrame(() => triggerRef.current?.focus());
            setMessage(
                'Installation queued. Keep this page open to watch its status. Restart the server after it completes.'
            );
            setAcknowledged(false);
        } catch (error) {
            setMessage(httpErrorToHuman(error));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (item: ManagedContent) => {
        setBusy(true);
        setMessage(null);
        try {
            await removeContent(uuid, type, item.id);
            await refreshInstalled();
            setPendingRemove(null);
            setMessage('Managed jar removed. Restart the server before expecting the change to take effect.');
        } catch (error) {
            setMessage(httpErrorToHuman(error));
        } finally {
            setBusy(false);
        }
    };

    return (
        <ServerContentBlock title={title}>
            <div className='space-y-5'>
                <div>
                    <h1 className='text-2xl font-semibold'>Minecraft {title}</h1>
                    <p className='text-sm text-muted-foreground'>
                        Discover compatible {title.toLowerCase()} from Modrinth and manage jars installed by IbisPanel.
                    </p>
                </div>
                <div className='rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm'>
                    <AlertTriangle size={16} className='mr-2 inline text-warning' />
                    Third-party jars can run code inside your game server. Review the project and license. Stop the
                    server before changing jars; restart it afterward.
                </div>
                <div className='flex gap-2 border-b border-border pb-2'>
                    <Button isSecondary={tab !== 'catalog'} onClick={() => setTab('catalog')}>
                        Catalog
                    </Button>
                    <Button isSecondary={tab !== 'installed'} onClick={() => setTab('installed')}>
                        Managed installations ({installed.data?.length ?? 0})
                    </Button>
                </div>
                {message && (
                    <p role='status' className='rounded-md border border-border px-4 py-3 text-sm'>
                        {message}
                    </p>
                )}
                <CatalogPanel
                    active={tab === 'catalog'}
                    title={title}
                    search={search}
                    onSearch={setSearch}
                    offset={offset}
                    onOffset={setOffset}
                    catalog={catalog}
                    installed={installed.data ?? []}
                    onProject={chooseProject}
                />
                <ManagedPanel
                    active={tab === 'installed'}
                    title={title}
                    installed={installed}
                    canDelete={canDelete}
                    busy={busy}
                    onProject={chooseProject}
                    onRemove={(item) => setPendingRemove(item.id)}
                />
                <Dialog
                    open={Boolean(projectId)}
                    title={project.data?.project.title ?? selectedHit?.title ?? 'Compatible releases'}
                    onClose={closeProject}
                    preventExternalClose={busy}
                    hideCloseIcon={busy}
                >
                    {message && (
                        <p role='alert' className='mb-3 text-sm text-destructive'>
                            {message}
                        </p>
                    )}
                    <ProjectPanel
                        active={Boolean(projectId)}
                        project={project}
                        release={release}
                        installed={selectedInstalled}
                        versionId={versionId}
                        onVersion={(id) => {
                            setVersionId(id);
                            setAcknowledged(false);
                        }}
                        profile={profile.data?.profile ?? null}
                        author={selectedHit?.author ?? null}
                        onCancel={closeProject}
                        acknowledged={acknowledged}
                        onAcknowledged={setAcknowledged}
                        busy={busy}
                        canCreate={canCreate}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        onInstall={() => void install()}
                    />
                </Dialog>
                <Dialog.Confirm
                    open={pendingRemove !== null}
                    title='Remove managed jar?'
                    description='The server must be stopped. You will need to restart it after removal.'
                    confirm='Remove jar'
                    pending={busy}
                    onClose={() => setPendingRemove(null)}
                    onConfirmed={() => {
                        const item = installed.data?.find((entry) => entry.id === pendingRemove);

                        if (item) {
                            void remove(item);
                        }
                    }}
                >
                    <p className='break-all text-sm'>
                        {installed.data?.find((entry) => entry.id === pendingRemove)?.filename}
                    </p>
                </Dialog.Confirm>
            </div>
        </ServerContentBlock>
    );
}
