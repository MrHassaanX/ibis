import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { httpErrorToHuman } from '@/api/http';
import { clearMinecraftProfile, getMinecraftProfile, setMinecraftProfile } from '@/api/server/minecraftProfile';
import { serverQueryKey } from '@/api/server/queries';
import Button from '@/components/elements/Button';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

const options = ['paper', 'spigot', 'purpur', 'folia', 'fabric', 'forge', 'neoforge', 'quilt'];
const inputClass = 'w-full min-h-10 rounded-md border border-input-border bg-input px-3 py-2 text-sm text-foreground';

export default function MinecraftProfileForm({ uuid }: { uuid: string }) {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ['minecraft-profile', uuid],
        queryFn: () => getMinecraftProfile(uuid),
    });
    const [software, setSoftware] = useState('paper');
    const [version, setVersion] = useState('');
    const [loaderVersion, setLoaderVersion] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const mod = ['fabric', 'forge', 'neoforge', 'quilt'].includes(software);

    useEffect(() => {
        if (query.data?.profile) {
            setSoftware(query.data.profile.software);
            setVersion(query.data.profile.minecraft_version);
            setLoaderVersion(query.data.profile.loader_version ?? '');
        }
    }, [query.data]);

    if (!query.data?.eligible) {
        return null;
    }

    const save = async () => {
        setBusy(true);
        setMessage(null);
        try {
            await setMinecraftProfile(uuid, software, version.trim(), mod ? loaderVersion.trim() : undefined);
            await query.refetch();
            await queryClient.invalidateQueries({ queryKey: serverQueryKey(uuid) });
            setMessage('Verified profile saved. The server navigation now reflects this software.');
            setConfirmed(false);
        } catch (error) {
            setMessage(httpErrorToHuman(error));
        } finally {
            setBusy(false);
        }
    };

    const clear = async () => {
        setBusy(true);
        setMessage(null);
        try {
            await clearMinecraftProfile(uuid);
            await query.refetch();
            await queryClient.invalidateQueries({ queryKey: serverQueryKey(uuid) });
            setMessage('Verified profile removed. Minecraft content managers are hidden.');
        } catch (error) {
            setMessage(httpErrorToHuman(error));
        } finally {
            setBusy(false);
        }
    };

    return (
        <TitledGreyBox title='Verified Minecraft Content Profile' className='mt-6'>
            <div className='space-y-4 text-sm'>
                <p className='text-muted-foreground'>
                    Verify the installed server jar and version before enabling Plugins or Mods. This record is per
                    server and does not change the Egg or reinstall the server. Update it after changing server
                    software.
                </p>
                <div className='grid gap-4 sm:grid-cols-3'>
                    <label>
                        Software
                        <select
                            className={`${inputClass} mt-1`}
                            value={software}
                            onChange={(event) => setSoftware(event.target.value)}
                        >
                            {options.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Minecraft version
                        <input
                            className={`${inputClass} mt-1`}
                            value={version}
                            onChange={(event) => setVersion(event.target.value)}
                            placeholder='1.21.11 or 26.3'
                        />
                    </label>
                    {mod && (
                        <label>
                            Loader version
                            <input
                                className={`${inputClass} mt-1`}
                                value={loaderVersion}
                                onChange={(event) => setLoaderVersion(event.target.value)}
                                placeholder='Verified Fabric/Forge version'
                            />
                        </label>
                    )}
                </div>
                <label className='flex items-start gap-2'>
                    <input
                        type='checkbox'
                        checked={confirmed}
                        onChange={(event) => setConfirmed(event.target.checked)}
                    />
                    <span>
                        I checked the installed server software and Minecraft version in the server console or files.
                        This profile is an administrator attestation, not an automatic scan.
                    </span>
                </label>
                {message && <p role='status'>{message}</p>}
                <div className='flex flex-wrap gap-2'>
                    <Button
                        disabled={busy || !confirmed || !version.trim() || (mod && !loaderVersion.trim())}
                        isLoading={busy}
                        onClick={() => void save()}
                    >
                        Save verified profile
                    </Button>
                    {query.data.profile && (
                        <Button isSecondary disabled={busy} onClick={() => void clear()}>
                            Clear profile
                        </Button>
                    )}
                </div>
            </div>
        </TitledGreyBox>
    );
}
