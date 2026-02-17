import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
import { httpsCallable } from 'firebase/functions';

import { analyzeByTypeCall } from './typeAnalysisService';

describe('analyzeByTypeCall', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when functions missing', async () => {
    await expect(analyzeByTypeCall({ functions: null, docHash: 'x', text: 't' })).rejects.toThrow(
      'Firebase functions not available'
    );
  });

  it('throws when callable missing', async () => {
    httpsCallable.mockReturnValue({});
    await expect(analyzeByTypeCall({ functions: {}, docHash: 'x', text: 't' })).rejects.toThrow(
      'analyzeByType callable not available'
    );
  });

  it('calls analyzeByType and returns data', async () => {
    const fakeResp = { data: { type: 'invoice' } };
    const mockFn = vi.fn().mockResolvedValue(fakeResp);
    httpsCallable.mockReturnValue(mockFn);
    const out = await analyzeByTypeCall({ functions: {}, docHash: 'h', text: 'hello' });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h', text: 'hello' });
    expect(out).toEqual(fakeResp.data);
  });
});
