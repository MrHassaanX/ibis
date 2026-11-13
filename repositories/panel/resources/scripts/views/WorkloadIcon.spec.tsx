// @vitest-environment jsdom

import { fireEvent, render } from '@testing-library/react';
import { expect, it } from 'vitest';
import WorkloadIcon from '@/themes/classic/views/shared/WorkloadIcon';

it('uses the server artwork and falls back once if an uploaded image disappears', () => {
    const { container, rerender } = render(<WorkloadIcon src='/storage/appearance/server-icon.png' />);
    const icon = container.querySelector('img') as HTMLImageElement;

    expect(icon.getAttribute('src')).toBe('/storage/appearance/server-icon.png');
    fireEvent.error(icon);
    expect(icon.getAttribute('src')).toBe('/brand/workloads/generic-server.svg');
    fireEvent.error(icon);
    expect(icon.getAttribute('src')).toBe('/brand/workloads/generic-server.svg');

    rerender(<WorkloadIcon src='/brand/workloads/minecraft.svg' />);
    expect(icon.getAttribute('src')).toBe('/brand/workloads/minecraft.svg');
});
