import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http, { httpErrorToHuman } from '@/api/http';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

export default function LoaderSettings({ readOnly }: { readOnly: boolean }) {
    const client = useQueryClient();
    const file = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const { data, error } = useQuery({
        queryKey: ['admin', 'loader'],
        queryFn: () => http.get<{ url: string | null }>('/api/admin/settings/loader').then(({ data }) => data),
    });
    const upload = async () => {
        const image = file.current?.files?.[0];

        if (!image) {
            return;
        }

        if (image.size > 2 * 1024 * 1024) {
            toast.error('Choose an image under 2 MB.');

            return;
        }

        setBusy(true);
        try {
            const body = new FormData();

            body.append('image', image);
            await http.post('/api/admin/settings/loader', body);
            await client.invalidateQueries({ queryKey: ['admin', 'loader'] });
            toast.success('Loader updated');
        } catch (cause) {
            toast.error(httpErrorToHuman(cause));
        } finally {
            setBusy(false);
        }
    };

    const reset = async () => {
        setBusy(true);
        try {
            await http.delete('/api/admin/settings/loader');
            await client.invalidateQueries({ queryKey: ['admin', 'loader'] });
            toast.success('Default loader restored');
        } catch (cause) {
            toast.error(httpErrorToHuman(cause));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className='mt-6'>
            <TitledGreyBox title='Loading Screen'>
                <p className='text-sm text-muted-foreground'>
                    Shown briefly while the panel starts. GIF, PNG, JPEG and animated WebP are supported, up to 2 MB and
                    1200 × 1200 pixels.
                </p>
                <div
                    className='my-5 flex min-h-40 items-center justify-center rounded-md border border-border bg-background'
                    aria-label='Loader preview'
                >
                    <img
                        src={data?.url ?? '/brand/ibis-icon-192.png'}
                        className='max-h-32 max-w-32 object-contain motion-reduce:hidden'
                        alt='Loader preview'
                    />
                    <span className='hidden text-sm text-foreground motion-reduce:inline'>Loading IbisPanel…</span>
                </div>
                {error && <p className='text-destructive'>{httpErrorToHuman(error)}</p>}
                <div className='flex flex-wrap items-center gap-3'>
                    <input
                        ref={file}
                        type='file'
                        accept='image/gif,image/png,image/jpeg,image/webp'
                        aria-label='Custom loader image'
                        disabled={readOnly || busy}
                        className='max-w-full text-sm'
                    />
                    <button
                        type='button'
                        onClick={upload}
                        disabled={readOnly || busy}
                        className='rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50'
                    >
                        Upload
                    </button>
                    <button
                        type='button'
                        onClick={reset}
                        disabled={readOnly || busy || !data?.url}
                        className='rounded-md border border-border px-4 py-2 disabled:opacity-50'
                    >
                        Reset to default
                    </button>
                </div>
            </TitledGreyBox>
        </div>
    );
}
