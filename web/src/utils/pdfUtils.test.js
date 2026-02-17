import { describe, it, expect } from 'vitest';
import { computeSHA256, detectScannedDocument, extractPdfText } from './pdfUtils';

describe('pdfUtils.computeSHA256', () => {
  it('computes correct SHA256 for string input', async () => {
    const hash = await computeSHA256('hello');
    // known SHA-256 of 'hello'
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('throws on unsupported input type', async () => {
    // @ts-ignore
    await expect(computeSHA256({})).rejects.toThrow('computeSHA256: unsupported input type');
  });
});

describe('pdfUtils.detectScannedDocument', () => {
  it('returns 0 for empty text or zero pages', () => {
    expect(detectScannedDocument('', 0)).toBe(0);
    // when textContent is empty the function returns 0 (early exit)
    expect(detectScannedDocument('', 3)).toBe(0);
  });

  it('computes ratio correctly', () => {
    const text = 'page1 text\f\fpage3';
    // pages are short (<50 chars) so all count as low-text pages => 3/3 === 1
    expect(detectScannedDocument(text, 3)).toBe(1);
  });
});

describe('pdfUtils.extractPdfText error path', () => {
  it('throws when pdf.getPage fails', async () => {
    const pdf = { getPage: () => { throw new Error('no page'); } };
    await expect(extractPdfText(pdf, 1)).rejects.toThrow('no page');
  });
});
