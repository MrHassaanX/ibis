import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import http from '@/api/http';

export interface Announcement {
    id: number;
    title: string;
    body: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    published: boolean;
    dismissible: boolean;
    starts_at: string | null;
    expires_at: string | null;
}

export const announcementColors = {
    info: 'border-primary bg-primary/10',
    success: 'border-success bg-success/10',
    warning: 'border-warning bg-warning/10',
    danger: 'border-destructive bg-destructive/10',
} satisfies Record<Announcement['type'], string>;

export default function AnnouncementBanners() {
    const client = useQueryClient();
    const { data = [] } = useQuery({
        queryKey: ['announcements', 'active'],
        queryFn: () => http.get<Announcement[]>('/api/client/announcements').then(({ data }) => data),
        staleTime: 60_000,
        refetchInterval: 60_000,
    });
    const dismiss = useMutation({
        mutationFn: (id: number) => http.post(`/api/client/announcements/${id}/dismiss`),
        onSuccess: () => client.invalidateQueries({ queryKey: ['announcements', 'active'] }),
    });

    return (
        <div className='space-y-3 mb-6' aria-label='Announcements'>
            {data.map((announcement) => (
                <section
                    key={announcement.id}
                    className={`relative rounded-md border-l-4 p-4 ${announcementColors[announcement.type]}`}
                >
                    <h2 className='font-semibold'>{announcement.title}</h2>
                    <p className='mt-1 whitespace-pre-wrap break-words text-sm'>{announcement.body}</p>
                    {announcement.dismissible && (
                        <button
                            type='button'
                            className='absolute right-3 top-3'
                            aria-label={`Dismiss ${announcement.title}`}
                            onClick={() => dismiss.mutate(announcement.id)}
                            disabled={dismiss.isPending}
                        >
                            <X size={16} />
                        </button>
                    )}
                </section>
            ))}
        </div>
    );
}
