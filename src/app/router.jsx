import { createBrowserRouter } from 'react-router-dom';

import DevFormPage from '@/pages/dev/DevFormPage';
import DevTablePage from '@/pages/dev/DevTablePage';
import DevUiPage from '@/pages/dev/DevUiPage';
import TokensPage from '@/pages/dev/TokensPage';

// The full route tree, lazy-loaded per role, arrives in phase 7.
export const router = createBrowserRouter([
  { path: '/dev/ui', element: <DevUiPage /> },
  { path: '/dev/table', element: <DevTablePage /> },
  { path: '/dev/form', element: <DevFormPage /> },
  { path: '*', element: <TokensPage /> },
]);
