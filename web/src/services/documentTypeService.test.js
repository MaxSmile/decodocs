import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
import { httpsCallable } from 'firebase/functions';

import { saveDocTypeOverrideCall, getDocumentTypeStateCall, detectDocumentTypeCall } from './documentTypeService';

describe('documentTypeService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saveDocTypeOverrideCall throws when functions missing', async () => {
    await expect(saveDocTypeOverrideCall({ functions: null, docHash: 'h', typeId: 't' })).rejects.toThrow('Firebase functions not available');
  });

  it('saveDocTypeOverrideCall returns data when callable present', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    httpsCallable.mockReturnValue(mockFn);
    const out = await saveDocTypeOverrideCall({ functions: {}, docHash: 'h', typeId: 't' });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h', typeId: 't' });
    expect(out).toEqual({ ok: true });
  });

  it('getDocumentTypeStateCall throws when functions missing', async () => {
    await expect(getDocumentTypeStateCall({ functions: null, docHash: 'h' })).rejects.toThrow('Firebase functions not available');
  });

  it('getDocumentTypeStateCall returns data when callable present', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { detected: {} } });
    httpsCallable.mockReturnValue(mockFn);
    const out = await getDocumentTypeStateCall({ functions: {}, docHash: 'h' });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h' });
    expect(out).toEqual({ detected: {} });
  });

  it('detectDocumentTypeCall throws when functions missing', async () => {
    await expect(detectDocumentTypeCall({ functions: null, docHash: 'h', stats: {}, text: '' })).rejects.toThrow('Firebase functions not available');
  });

  it('detectDocumentTypeCall returns data when callable present', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { typeId: 'x' } });
    httpsCallable.mockReturnValue(mockFn);
    const out = await detectDocumentTypeCall({ functions: {}, docHash: 'h', stats: {}, text: 't' });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h', stats: {}, text: 't' });
    expect(out).toEqual({ typeId: 'x' });
  });
});
