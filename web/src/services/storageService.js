import { httpsCallable } from 'firebase/functions';

const resolveMockCallable = (name) => {
  if (typeof window === 'undefined') return null;
  const callables = window.MOCK_STORAGE_CALLABLES;
  if (!callables || typeof callables[name] !== 'function') return null;
  return callables[name];
};

export const createUploadUrl = async (functions, payload) => {
  const mockCallable = resolveMockCallable('storageCreateUploadUrl');
  if (mockCallable) {
    return mockCallable(payload);
  }

  if (!functions) {
    throw new Error('storageCreateUploadUrl callable not available');
  }

  const fn = httpsCallable(functions, 'storageCreateUploadUrl');
  const result = await fn(payload);
  return result?.data || result;
};

export const createDownloadUrl = async (functions, payload) => {
  const mockCallable = resolveMockCallable('storageCreateDownloadUrl');
  if (mockCallable) {
    return mockCallable(payload);
  }

  if (!functions) {
    throw new Error('storageCreateDownloadUrl callable not available');
  }

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
