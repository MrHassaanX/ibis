import {
    clientInspectAMinecraftRelease,
    clientInstallOrUpdateMinecraftContent,
    clientListCompatibleMinecraftReleases,
    clientListManagedMinecraftInstallations,
    clientRemoveManagedMinecraftContent,
    clientSearchMinecraftContent,
} from '@/api/generated';

export type ContentType = 'plugin' | 'mod';
export interface ContentHit {
    id: string;
    title: string;
    description: string;
    icon_url: string | null;
    author: string;
}
export interface ContentVersion {
    id: string;
    name: string;
    version_number: string;
    version_type: 'release' | 'beta' | 'alpha';
    date_published: string | null;
    dependencies: { type: string; project_id: string | null; version_id: string | null }[];
}
export interface ManagedContent {
    id: number;
    project_id: string;
    version_id: string;
    filename: string;
    state: 'queued' | 'downloading' | 'verifying' | 'installing' | 'installed' | 'failed';
    display_state:
        | 'queued'
        | 'worker_unavailable'
        | 'stalled'
        | 'downloading'
        | 'verifying'
        | 'installing'
        | 'installed'
        | 'failed';
    worker_available: boolean;
    can_retry: boolean;
    updated_at: string;
    sha512: string | null;
    file_status: 'verified' | 'missing_or_changed' | null;
    error: string | null;
    update_available: boolean | null;
    latest_version_id: string | null;
}
export interface ContentRelease {
    project: { id: string; title: string; license: string };
    version: { id: string; name: string; channel: string };
    file: { name: string; size: number | null; sha512: string | null };
    dependencies: ContentVersion['dependencies'];
    warning: string;
}

export async function searchContent(uuid: string, type: ContentType, query: string, offset: number) {
    const { data } = await clientSearchMinecraftContent({
        path: { server_uuid: uuid, type },
        query: { query, offset },
    });

    return data as { hits: ContentHit[]; total: number; offset: number };
}

export async function projectVersions(uuid: string, type: ContentType, project: string) {
    const { data } = await clientListCompatibleMinecraftReleases({ path: { server_uuid: uuid, type, project } });

    return data as {
        project: {
            id: string;
            title: string;
            description: string;
            icon_url: string | null;
            license: string;
            url: string;
        };
        versions: ContentVersion[];
    };
}

export async function releaseDetails(uuid: string, type: ContentType, project: string, version: string) {
    const { data } = await clientInspectAMinecraftRelease({ path: { server_uuid: uuid, type, project, version } });

    return data as ContentRelease;
}

export async function installedContent(uuid: string, type: ContentType) {
    const { data } = await clientListManagedMinecraftInstallations({ path: { server_uuid: uuid, type } });

    return (data?.data ?? []) as ManagedContent[];
}

export async function installContent(uuid: string, type: ContentType, project_id: string, version_id: string) {
    return (
        await clientInstallOrUpdateMinecraftContent({
            path: { server_uuid: uuid, type },
            body: { project_id, version_id },
        })
    ).data;
}

export async function removeContent(uuid: string, type: ContentType, id: number) {
    return (await clientRemoveManagedMinecraftContent({ path: { server_uuid: uuid, type, id } })).data;
}
