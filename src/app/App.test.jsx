import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders with all providers', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /design tokens/i })).toBeInTheDocument();
  });
});
