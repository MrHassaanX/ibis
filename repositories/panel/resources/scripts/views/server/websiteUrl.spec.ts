import { describe, expect, it } from 'vitest';
import { createTestServer } from '../fixtures';
import { websiteAddress } from './websiteUrl';

function server(ip: string, features = ['service.http'], port = 64738) {
    const item = createTestServer({ eggFeatures: features });

    item.attributes.relationships = {
        allocations: {
            object: 'list',
            data: [
                {
                    object: 'allocation',
                    attributes: { id: 1, ip, ip_alias: null, port, notes: null, is_default: true },
                },
            ],
        },
    };

    return item;
}

describe('websiteAddress', () => {
    it('uses the actual private allocation and labels it as local', () => {
        expect(websiteAddress(server('172.20.175.81'))).toEqual({
            url: 'http://172.20.175.81:64738/',
            label: 'Local Network',
        });
    });

    it('never offers an HTTP link for a bot or other workload without HTTP capability', () => {
        expect(websiteAddress(server('172.20.175.81', []))).toBeNull();
    });

    it('does not link bind wildcards or malformed allocations', () => {
        expect(websiteAddress(server('0.0.0.0'))).toBeNull();
        expect(websiteAddress(server('::'))).toBeNull();
        expect(websiteAddress(server('172.20.175.81', ['service.http'], 0))).toBeNull();
    });

    it('does not claim public reachability for an allocation address', () => {
        expect(websiteAddress(server('203.0.113.10'))).toEqual({
            url: 'http://203.0.113.10:64738/',
            label: 'Allocation Address',
        });
    });
});
