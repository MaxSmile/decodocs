import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
import { httpsCallable } from 'firebase/functions';

import {
  explainSelectionCall,
  highlightRisksCall,
  translateToPlainEnglishCall,
} from './analysisService';

describe('analysisService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('explainSelectionCall calls callable and returns data', async () => {
    const fake = { data: { explanation: 'x' } };
    const mockFn = vi.fn().mockResolvedValue(fake);
    httpsCallable.mockReturnValue(mockFn);
    const out = await explainSelectionCall({ functions: {}, docHash: 'h', selection: { a: 1 }, documentContext: {} });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h', selection: { a: 1 }, documentContext: {} });
    expect(out).toEqual(fake.data);
  });

  it('highlightRisksCall calls callable and returns data', async () => {
    const fake = { data: { risks: [] } };
    const mockFn = vi.fn().mockResolvedValue(fake);
    httpsCallable.mockReturnValue(mockFn);
    const out = await highlightRisksCall({ functions: {}, docHash: 'h', documentText: 't', documentType: 'invoice' });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h', documentText: 't', documentType: 'invoice' });
    expect(out).toEqual(fake.data);
  });

  it('translateToPlainEnglishCall calls callable and returns data', async () => {
    const fake = { data: { plain: 'hi' } };
    const mockFn = vi.fn().mockResolvedValue(fake);
    httpsCallable.mockReturnValue(mockFn);
    const out = await translateToPlainEnglishCall({ functions: {}, docHash: 'h', legalText: 'lorem' });
    expect(mockFn).toHaveBeenCalledWith({ docHash: 'h', legalText: 'lorem' });
    expect(out).toEqual(fake.data);
  });
});
