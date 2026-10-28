import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('boots to the home page with all providers', async () => {
    render(<App />);
    expect(await screen.findByRole('link', { name: 'KJT Foodie home' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});
