import { createBrowserRouter } from 'react-router-dom';

import TokensPage from '@/pages/dev/TokensPage';

// The full route tree, lazy-loaded per role, arrives in phase 7.
export const router = createBrowserRouter([{ path: '*', element: <TokensPage /> }]);
