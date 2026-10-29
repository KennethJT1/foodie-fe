import { ProfileForm } from '@/features/auth';
import { RiderProfile } from '@/features/riders';

export default function ProfilePage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <RiderProfile>
        <ProfileForm />
      </RiderProfile>
    </div>
  );
}
