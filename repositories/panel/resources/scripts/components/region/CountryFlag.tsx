export default function CountryFlag({ code }: { code?: string | null }) {
    if (!code || !/^[A-Z]{2}$/.test(code)) {
        return null;
    }

    return (
        <span className={`fi fi-${code.toLowerCase()} inline-block shrink-0`} role='img' aria-label={`${code} flag`} />
    );
}
