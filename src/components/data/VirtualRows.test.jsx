import { render, screen } from '@testing-library/react';

import { VirtualRows } from './VirtualRows';

describe('VirtualRows', () => {
  it('only puts the rows near the screen in the DOM', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ id: `item-${i}` }));
    render(
      <VirtualRows
        items={items}
        getKey={(x) => x.id}
        estimateRowHeight={200}
        renderItem={(x) => <span>{x.id}</span>}
      />,
    );
    const shown = screen.getAllByRole('listitem').length;
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(30);
    expect(screen.getByRole('list')).toHaveStyle({ height: '100000px' });
  });
});
