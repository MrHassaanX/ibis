import {
    clientClearMinecraftSoftwareProfile,
    clientGetMinecraftSoftwareProfile,
    clientSetMinecraftSoftwareProfile,
} from '@/api/generated';

export interface MinecraftProfile {
    software: string;
    minecraft_version: string;
    loader_version: string | null;
}

export async function getMinecraftProfile(uuid: string) {
    const { data } = await clientGetMinecraftSoftwareProfile({ path: { server_uuid: uuid } });

    return data as { profile: MinecraftProfile | null; eligible: boolean };
}

export async function setMinecraftProfile(
    uuid: string,
    software: string,
    minecraftVersion: string,
    loaderVersion: string | undefined
) {
    return (
        await clientSetMinecraftSoftwareProfile({
            path: { server_uuid: uuid },
            body: {
                software,
                minecraft_version: minecraftVersion,
                loader_version: loaderVersion,
                confirmed_installed: true,
            },
        })
    ).data;
}

export async function clearMinecraftProfile(uuid: string) {
    return (await clientClearMinecraftSoftwareProfile({ path: { server_uuid: uuid } })).data;
}
