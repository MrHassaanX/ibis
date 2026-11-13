import { clientReadMinecraftProperties, clientUpdateMinecraftProperties } from '@/api/generated';

export interface PropertiesFile {
    path: string;
    content: string;
    hash: string;
}

export async function readProperties(uuid: string): Promise<PropertiesFile> {
    const { data } = await clientReadMinecraftProperties({ path: { server_uuid: uuid } });

    if (data?.path === undefined || data.content === undefined || data.hash === undefined) {
        throw new Error('The server returned an incomplete properties file.');
    }

    return { path: data.path, content: data.content, hash: data.hash };
}

export async function writeProperties(
    uuid: string,
    content: string,
    originalHash: string
): Promise<Pick<PropertiesFile, 'path' | 'hash'>> {
    const { data } = await clientUpdateMinecraftProperties({
        path: { server_uuid: uuid },
        body: { content, original_hash: originalHash },
    });

    if (data?.path === undefined || data.hash === undefined) {
        throw new Error('The server did not confirm the saved properties file.');
    }

    return { path: data.path, hash: data.hash };
}
