import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
import { httpsCallable } from 'firebase/functions';

import { analyzeTextCall } from './analyzeTextService';

describe('analyzeTextCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when functions is not provided', async () => {
    await expect(analyzeTextCall({ functions: null, payload: {} })).rejects.toThrow(
      'Firebase functions not available'
    );
  });

  it('throws when httpsCallable does not return a function', async () => {
    httpsCallable.mockReturnValue({});
    const fakeFns = {};
    await expect(analyzeTextCall({ functions: fakeFns, payload: {} })).rejects.toThrow(
      'analyzeText callable not available'
    );
  });

  it('calls the callable and returns the response', async () => {
    const fakeResp = { data: { ok: true } };
    const mockFn = vi.fn().mockResolvedValue(fakeResp);
    httpsCallable.mockReturnValue(mockFn);
    const fakeFns = {};
    const resp = await analyzeTextCall({ functions: fakeFns, payload: { text: 'hello' } });
    expect(mockFn).toHaveBeenCalledWith({ text: 'hello' });
    expect(resp).toBe(fakeResp);
  });
});
