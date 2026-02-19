import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));

import { httpsCallable } from 'firebase/functions';
import { submitUserReport } from './reportService.js';

describe('submitUserReport', () => {
  it('calls submitUserReport callable and returns data', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    httpsCallable.mockReturnValue(mockFn);

    const result = await submitUserReport({ name: 'mock-functions' }, { kind: 'bug', message: 'Test issue report' });

    expect(httpsCallable).toHaveBeenCalledWith({ name: 'mock-functions' }, 'submitUserReport');
    expect(mockFn).toHaveBeenCalledWith({ kind: 'bug', message: 'Test issue report' });
    expect(result).toEqual({ ok: true });
  });
});
