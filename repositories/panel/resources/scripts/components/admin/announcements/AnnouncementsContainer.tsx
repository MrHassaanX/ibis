import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import http, { httpErrorToHuman } from '@/api/http';
import AdminContentBlock from '@/components/admin/AdminContentBlock';
import { announcementColors, type Announcement } from '@/components/dashboard/AnnouncementBanners';

type Draft = Omit<Announcement, 'id'>;
const empty: Draft = {
    title: '',
    body: '',
    type: 'info',
    published: false,
    dismissible: true,
    starts_at: null,
    expires_at: null,
};
const input = 'w-full rounded-md border border-border bg-background px-3 py-2 text-foreground';
const button = 'rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50';
const toLocalInput = (value: string | null): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const toUtc = (value: string | null): string | null => (value ? new Date(value).toISOString() : null);

export default function AnnouncementsContainer() {
    const client = useQueryClient();
    const [draft, setDraft] = useState<Draft>(empty);
    const [editing, setEditing] = useState<number | null>(null);
    const [preview, setPreview] = useState(false);
    const [busy, setBusy] = useState(false);
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'announcements', page],
        queryFn: () =>
            http
                .get<{ data: Announcement[]; current_page: number; last_page: number }>('/api/admin/announcements', {
                    params: { page },
                })
                .then(({ data }) => data),
    });

    const refresh = async () => {
        await Promise.all([
            client.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
            client.invalidateQueries({ queryKey: ['announcements', 'active'] }),
        ]);
    };

    const save = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        try {
            const payload = { ...draft, starts_at: toUtc(draft.starts_at), expires_at: toUtc(draft.expires_at) };

            if (editing) {
                await http.put(`/api/admin/announcements/${editing}`, payload);
            } else {
                await http.post('/api/admin/announcements', payload);
            }

            setDraft(empty);
            setEditing(null);
            setPreview(false);
            await refresh();
            toast.success('Announcement saved');
        } catch (cause) {
            toast.error(httpErrorToHuman(cause));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: number) => {
        if (!window.confirm('Delete this announcement?')) {
            return;
        }

        try {
            await http.delete(`/api/admin/announcements/${id}`);
            await refresh();
            toast.success('Announcement deleted');
        } catch (cause) {
            toast.error(httpErrorToHuman(cause));
        }
    };

    const edit = (item: Announcement) => {
        setEditing(item.id);
        setDraft({
            title: item.title,
            body: item.body,
            type: item.type,
            published: item.published,
            dismissible: item.dismissible,
            starts_at: toLocalInput(item.starts_at),
            expires_at: toLocalInput(item.expires_at),
        });
        setPreview(false);
    };

    return (
        <AdminContentBlock
            title='Admin · Announcements'
            heading='Announcements'
            description='Create and schedule notices for the dashboard.'
        >
            <form onSubmit={save} className='rounded-lg border border-border bg-card p-5 space-y-4'>
                <h2 className='text-lg font-semibold'>{editing ? 'Edit announcement' : 'New announcement'}</h2>
                <label className='block'>
                    Title
                    <input
                        className={input}
                        value={draft.title}
                        maxLength={120}
                        required
                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    />
                </label>
                <label className='block'>
                    Message
                    <textarea
                        className={input}
                        value={draft.body}
                        maxLength={5000}
                        rows={4}
                        required
                        onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                    />
                </label>
                <div className='grid gap-4 sm:grid-cols-3'>
                    <label>
                        Type
                        <select
                            className={input}
                            value={draft.type}
                            onChange={(event) => setDraft({ ...draft, type: event.target.value as Draft['type'] })}
                        >
                            <option value='info'>Information</option>
                            <option value='success'>Success</option>
                            <option value='warning'>Warning</option>
                            <option value='danger'>Important</option>
                        </select>
                    </label>
                    <label>
                        Starts at (optional)
                        <input
                            className={input}
                            type='datetime-local'
                            value={draft.starts_at ?? ''}
                            onChange={(event) => setDraft({ ...draft, starts_at: event.target.value || null })}
                        />
                    </label>
                    <label>
                        Expires at (optional)
                        <input
                            className={input}
                            type='datetime-local'
                            value={draft.expires_at ?? ''}
                            onChange={(event) => setDraft({ ...draft, expires_at: event.target.value || null })}
                        />
                    </label>
                </div>
                <div className='flex flex-wrap gap-5'>
                    <label>
                        <input
                            type='checkbox'
                            checked={draft.published}
                            onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
                        />{' '}
                        Published
                    </label>
                    <label>
                        <input
                            type='checkbox'
                            checked={draft.dismissible}
                            onChange={(event) => setDraft({ ...draft, dismissible: event.target.checked })}
                        />{' '}
                        Allow dismissal
                    </label>
                </div>
                <div className='flex gap-3'>
                    <button className={button} disabled={busy}>
                        Save announcement
                    </button>
                    <button
                        type='button'
                        className='rounded-md border border-border px-4 py-2'
                        onClick={() => setPreview(!preview)}
                    >
                        Preview
                    </button>
                    {editing && (
                        <button
                            type='button'
                            onClick={() => {
                                setEditing(null);
                                setDraft(empty);
                            }}
                        >
                            Cancel edit
                        </button>
                    )}
                </div>
                {preview && (
                    <section className={`rounded-md border-l-4 p-4 ${announcementColors[draft.type]}`}>
                        <h3 className='font-semibold'>{draft.title || 'Announcement title'}</h3>
                        <p className='whitespace-pre-wrap break-words'>{draft.body || 'Message preview'}</p>
                    </section>
                )}
            </form>
            {error && <p className='mt-5 text-destructive'>{httpErrorToHuman(error)}</p>}
            {isLoading && <p className='mt-5'>Loading announcements…</p>}
            <div className='mt-6 space-y-3'>
                {data?.data.map((item) => (
                    <article
                        key={item.id}
                        className='rounded-lg border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
                    >
                        <div>
                            <h3 className='font-semibold'>{item.title}</h3>
                            <p className='text-sm text-muted-foreground'>
                                {item.published ? 'Published' : 'Draft'} · {item.type}
                                {item.starts_at ? ` · Starts ${new Date(item.starts_at).toLocaleString()}` : ''}
                                {item.expires_at ? ` · Expires ${new Date(item.expires_at).toLocaleString()}` : ''}
                            </p>
                        </div>
                        <div className='flex gap-3'>
                            <button type='button' className='text-primary' onClick={() => edit(item)}>
                                Edit
                            </button>
                            <button type='button' className='text-destructive' onClick={() => remove(item.id)}>
                                Delete
                            </button>
                        </div>
                    </article>
                ))}
            </div>
            {!!data && data.last_page > 1 && (
                <div className='mt-4 flex items-center justify-end gap-3'>
                    <button type='button' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Previous
                    </button>
                    <span>
                        Page {data.current_page} of {data.last_page}
                    </span>
                    <button type='button' disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>
                        Next
                    </button>
                </div>
            )}
        </AdminContentBlock>
    );
}
