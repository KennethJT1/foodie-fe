import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders the design tokens page', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /design tokens/i })).toBeInTheDocument();
  });
});
