import { api, unwrap } from './api-client';
import { compressImage } from './image';

/**
 * Uploads one image through `POST /uploads` and returns the URL to send to other endpoints.
 * The API only accepts files the user uploaded here with the matching `purpose`
 * (food_photo, vendor_logo, vendor_cover, vendor_document, rider_document, refund_photo, avatar).
 * @param {File} file
 * @param {string} purpose
 * @returns {Promise<string>}
 */
export async function uploadFile(file, purpose) {
  const { blob } = await compressImage(file);
  const form = new FormData();
  form.append('purpose', purpose);
  form.append('file', blob, blob === file ? file.name : 'upload.webp');
  const { url } = await api.post('/uploads', form).then(unwrap);
  return url;
}
