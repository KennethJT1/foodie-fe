import { Spinner } from '@/components/ui/Spinner';

/** Used only while a lazy route chunk downloads. Screens use skeletons for data. */
export function PageLoader({ label = 'Loading page' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-primary">
      <Spinner label={label} className="[&_svg]:h-8 [&_svg]:w-8" />
    </div>
  );
}
