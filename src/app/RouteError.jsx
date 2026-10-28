import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { ErrorState } from '@/components/feedback';

/** Shown when a route crashes or its code chunk fails to load (e.g. after a new deploy). */
export function RouteError() {
  const error = useRouteError();
  const isChunk = /dynamically imported module|Loading chunk/i.test(String(error?.message));
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <ErrorState
        title={
          isRouteErrorResponse(error) && error.status === 404
            ? "We couldn't find that page"
            : 'Something went wrong'
        }
        message={
          isChunk
            ? 'A new version of KJT Foodie is available. Reload to continue.'
            : 'Please reload the page. If it keeps happening, contact support.'
        }
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
