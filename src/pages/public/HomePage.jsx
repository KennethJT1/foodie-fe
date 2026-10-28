import { HomeFeed } from '@/features/feed';

export default function HomePage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <h1 className="sr-only">Food near you</h1>
      <HomeFeed />
    </div>
  );
}
