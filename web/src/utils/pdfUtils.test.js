import { describe, it, expect, vi } from 'vitest';
import { computeSHA256, detectScannedDocument, extractPdfText, extractPdfTextAllPages } from './pdfUtils';

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

describe('pdfUtils.extractPdfText', () => {
  it('extracts text from a single page', async () => {
    const mockPage = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: 'Hello' }, { str: 'World' }]
      })
    };
    const pdf = {
      getPage: vi.fn().mockResolvedValue(mockPage)
    };

    const text = await extractPdfText(pdf, 1);
    expect(pdf.getPage).toHaveBeenCalledWith(1);
    expect(mockPage.getTextContent).toHaveBeenCalled();
    expect(text).toBe('Hello World');
  });
});

describe('pdfUtils.extractPdfTextAllPages', () => {
  it('extracts text from all pages and joins with form feed', async () => {
    const mockPage1 = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: 'Page' }, { str: '1' }]
      })
    };
    const mockPage2 = {
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: 'Page' }, { str: '2' }]
      })
    };
    const pdf = {
      numPages: 2,
      getPage: vi.fn().mockImplementation((pageNum) => {
        if (pageNum === 1) return Promise.resolve(mockPage1);
        if (pageNum === 2) return Promise.resolve(mockPage2);
        return Promise.reject(new Error('Invalid page'));
      })
    };

    const text = await extractPdfTextAllPages(pdf);
    expect(pdf.getPage).toHaveBeenCalledTimes(2);
    expect(text).toBe('Page 1\fPage 2\f');
  });

  it('throws on error (do not silently substitute placeholder text)', async () => {
    const pdf = {
      numPages: 1,
      getPage: vi.fn().mockRejectedValue(new Error('Failed to get page'))
    };

    await expect(extractPdfTextAllPages(pdf)).rejects.toThrow('Failed to get page');
  });
});
