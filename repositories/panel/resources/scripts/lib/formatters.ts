import { getBootstrapSiteSettings } from '@/bootstrap';

const _CONVERSION_UNIT = 1024;

function mbToBytes(megabytes: number): number {
    return Math.floor(megabytes * _CONVERSION_UNIT * _CONVERSION_UNIT);
}

const unitSystem = () =>
    globalThis.window && getBootstrapSiteSettings()?.appearance?.storage_unit === 'decimal'
        ? { base: 1000, labels: ['Bytes', 'KB', 'MB', 'GB', 'TB'] }
        : { base: 1024, labels: ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'] };

function byteUnitIndex(bytes: number, base: number, count: number): number {
    return Math.min(Math.floor(Math.log(bytes) / Math.log(base)), count - 1);
}

function scaleBytes(bytes: number, unit: number, decimals: number, base: number): number {
    return Number((bytes / base ** unit).toFixed(Math.floor(Math.max(0, decimals))));
}

function bytesToString(bytes: number, decimals = 2): string {
    if (bytes < 1) {
        return '0 Bytes';
    }

    const { base, labels } = unitSystem();
    const i = byteUnitIndex(bytes, base, labels.length);

    return `${scaleBytes(bytes, i, decimals, base)} ${labels[i]}`;
}

function bytesRatioToString(used: number, total: number, decimals = 2): string {
    const reference = Math.max(total, used);

    if (reference < 1) {
        return '0 / 0 Bytes';
    }

    const { base, labels } = unitSystem();
    const i = byteUnitIndex(reference, base, labels.length);

    const scaled = Math.max(0, used) / base ** i;
    const usedText =
        scaled > 0 && scaled < 10 ** -decimals
            ? `<${(10 ** -decimals).toFixed(decimals)}`
            : String(scaleBytes(Math.max(0, used), i, decimals, base));

    return `${usedText} / ${scaleBytes(total, i, decimals, base)} ${labels[i]}`;
}

/** Wraps IPv6 addresses in brackets. */
function ip(value: string): string {
    // noinspection RegExpSimplifiable
    return /([a-f0-9:]+:+)+[a-f0-9]+/.test(value) ? `[${value}]` : value;
}

export { ip, mbToBytes, bytesToString, bytesRatioToString };
