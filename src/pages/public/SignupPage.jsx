import { Navigate, useParams } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { SignupForm } from '@/features/auth';

const ROLES = ['customer', 'vendor', 'rider'];

export default function SignupPage() {
  const { role } = useParams();
  if (!ROLES.includes(role)) return <Navigate to={ROUTES.signup('customer')} replace />;
  return <SignupForm role={role} />;
}
