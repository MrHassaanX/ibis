import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let current: string | undefined;
let brandName = 'IbisPanel';

const read = (): string => current ?? document.title;

/** Titles the document; `PageContentBlock` and `ServerContentBlock` call it with their `title`. */
export function setPageTitle(title: string): void {
    current = title;
    document.title = `${title} | ${brandName}`;
    for (const listener of listeners) {
        listener();
    }
}

/** Keep the browser title current when an administrator renames the panel. */
export function setPageBrandName(name: string): void {
    brandName = name;
    document.title = current ? `${current} | ${name}` : name;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

/** The document title the page on show set, such as "Survival | Console", for a shell to show in its own bar. */
export function usePageTitle(): string {
    return useSyncExternalStore(subscribe, read, read);
}
