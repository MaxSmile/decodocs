import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
import { httpsCallable } from 'firebase/functions';

import { preflightCheckCall } from './preflightService';

describe('preflightCheckCall', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when functions not provided', async () => {
    await expect(preflightCheckCall({ functions: null, docHash: 'h', stats: {} })).rejects.toThrow(
      'Firebase functions not available'
    );
  });

  it('throws when callable not available', async () => {
    httpsCallable.mockReturnValue({});
    await expect(preflightCheckCall({ functions: {}, docHash: 'h', stats: {} })).rejects.toThrow(
      'preflightCheck callable not available'
    );
  });

  it('calls preflightCheck and returns data', async () => {
    const fakeResp = { data: { ok: true } };
    const mockFn = vi.fn().mockResolvedValue(fakeResp);
    httpsCallable.mockReturnValue(mockFn);
    const res = await preflightCheckCall({ functions: {}, docHash: 'abc', stats: { pages: 1 } });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'abc', stats: { pages: 1 } });
    expect(res).toEqual(fakeResp.data);
  });
});
