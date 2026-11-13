import type { Server } from '@/api/server/types';
import { relationshipData } from '@/api/relationships';

export interface WebsiteAddress {
    url: string;
    label: 'Local Network' | 'Allocation Address';
}

function isPrivateIpv4(parts: number[]): boolean {
    return (
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    );
}

function browserHostParts(host: string): number[] | null {
    const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

    if (!match || host === '0.0.0.0') {
        return null;
    }

    const parts = match.slice(1).map(Number);

    return parts.some((part) => part > 255) ? null : parts;
}

/** Only an Egg that explicitly declares HTTP service capability gets a browser link. */
export function websiteAddress(server: Server): WebsiteAddress | null {
    if (!server.attributes.egg_features?.includes('service.http')) {
        return null;
    }

    const allocation = relationshipData(server.attributes.relationships?.allocations).find(
        (item) => item.attributes.is_default
    )?.attributes;

    if (!allocation || !Number.isInteger(allocation.port) || allocation.port < 1 || allocation.port > 65535) {
        return null;
    }

    // An allocation's bind wildcard and a console listening address are not browser destinations.
    const host = allocation.ip.trim();
    const parts = browserHostParts(host);

    if (!parts) {
        return null;
    }

    const local = isPrivateIpv4(parts);

    return { url: `http://${host}:${allocation.port}/`, label: local ? 'Local Network' : 'Allocation Address' };
}
