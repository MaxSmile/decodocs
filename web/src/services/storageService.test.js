import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
import { httpsCallable } from 'firebase/functions';

import {
  createUploadUrl,
  createDownloadUrl,
  uploadViaPresignedUrl,
  downloadBlobViaPresignedUrl,
} from './storageService';

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('createUploadUrl returns .data when present', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { url: 'u' } });
    httpsCallable.mockReturnValue(mockFn);
    const out = await createUploadUrl({}, { foo: 'bar' });
    expect(mockFn).toHaveBeenCalledWith({ foo: 'bar' });
    expect(out).toEqual({ url: 'u' });
  });

  it('createDownloadUrl returns result when no .data', async () => {
    const mockFn = vi.fn().mockResolvedValue('plain');
    httpsCallable.mockReturnValue(mockFn);
    const out = await createDownloadUrl({}, { x: 1 });
    expect(out).toBe('plain');
  });

  it('uploadViaPresignedUrl succeeds on ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await expect(uploadViaPresignedUrl({ url: 'u', file: 'f', contentType: 'text/plain' })).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith('u', expect.objectContaining({ method: 'PUT' }));
  });

  it('uploadViaPresignedUrl throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    await expect(uploadViaPresignedUrl({ url: 'u', file: 'f' })).rejects.toThrow('Upload failed with status 403');
  });

  it('downloadBlobViaPresignedUrl returns blob on ok', async () => {
    const fakeBlob = { size: 123 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(fakeBlob) });
    const out = await downloadBlobViaPresignedUrl('http://x');
    expect(out).toBe(fakeBlob);
  });

  it('downloadBlobViaPresignedUrl throws on non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(downloadBlobViaPresignedUrl('http://x')).rejects.toThrow('Download failed with status 500');
  });
});
