import { http } from 'msw';

import { readAsDataUrl } from '@/lib/image';

import { requireUser } from '../utils/auth';
import { api } from '../utils/path';
import { created, fail, latency, validationError } from '../utils/respond';

// Who may upload for each purpose, as on the real API
const ROLES = {
  food_photo: ['vendor'],
  vendor_logo: ['vendor'],
  vendor_cover: ['vendor'],
  vendor_document: ['vendor'],
  rider_document: ['rider'],
  refund_photo: ['customer'],
  avatar: ['customer', 'vendor', 'rider', 'admin'],
};

export const uploadHandlers = [
  // The mock keeps the file as a data URL instead of storing it
  http.post(api('/uploads'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const form = await request.formData();
    const purpose = form.get('purpose');
    const file = form.get('file');
    if (!ROLES[purpose]) return validationError({ purpose: 'Choose what the file is for' });
    if (!ROLES[purpose].includes(user.role))
      return fail(403, { code: 'FORBIDDEN', message: "You can't upload that kind of file." });
    if (!file || typeof file === 'string' || !file.size)
      return validationError({ file: 'Choose a file to upload' });
    return created({ url: await readAsDataUrl(file), width: null, height: null, bytes: file.size });
  }),
];
