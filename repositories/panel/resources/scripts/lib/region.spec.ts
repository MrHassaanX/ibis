import { expect, it } from 'vitest';
import { countryName, countryOptions } from './region';

it('offers every ISO 3166-1 country and territory code without pseudo-regions', () => {
    expect(countryOptions).toHaveLength(250); // 249 codes plus the optional empty choice.
    expect(countryOptions.map(({ value }) => value)).toContain('IN');
    expect(countryOptions.map(({ value }) => value)).toContain('ZA');
    expect(countryOptions.map(({ value }) => value)).not.toContain('EU');
    expect(countryName('IN')).toBe('India');
});
