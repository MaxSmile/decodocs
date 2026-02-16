import { httpsCallable } from 'firebase/functions';

export const createUploadUrl = async (functions, payload) => {
  const fn = httpsCallable(functions, 'storageCreateUploadUrl');
  const result = await fn(payload);
  return result?.data || result;
};

export const createDownloadUrl = async (functions, payload) => {
  const fn = httpsCallable(functions, 'storageCreateDownloadUrl');
  const result = await fn(payload);
  return result?.data || result;
};

export const uploadViaPresignedUrl = async ({ url, file, contentType }) => {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': contentType || file?.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
};

export const downloadBlobViaPresignedUrl = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed with status ${res.status}`);
  }
  return res.blob();
};
