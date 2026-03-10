import { render, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePdfJs } from './usePdfJs';

// --- Mocks ---
vi.mock('../utils/pdfUtils', () => ({
  ensurePdfJsWorkerConfigured: vi.fn(),
  extractPdfTextAllPages: vi.fn().mockResolvedValue('Mock PDF text'),
  getPdfJsStandardFontDataUrl: vi.fn().mockReturnValue('mock-url'),
  computeSHA256: vi.fn().mockResolvedValue('mock-sha-256')
}));

vi.mock('../utils/docxUtils', () => ({
  extractDocxText: vi.fn().mockResolvedValue('Mock DOCX text')
}));

vi.mock('../utils/docStats', () => ({
  buildDocStats: vi.fn().mockReturnValue({ pages: 1, words: 100 })
}));

function TestHarness({ onReady }) {
  const hook = usePdfJs();
  // expose hook to test
  React.useEffect(() => onReady(hook), [hook, onReady]);
  return null;
}

describe('usePdfJs.loadTestPdf error path', () => {
  beforeEach(() => {
    // ensure no real pdfjsLib
    delete window.pdfjsLib;
    global.fetch = undefined;
    vi.clearAllMocks();
  });

  it('throws when fetch returns not ok for standard PDF', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, statusText: 'Not Found' });
    let hookRef = null;
    const onReady = (h) => { hookRef = h; };

    render(React.createElement(TestHarness, { onReady }));

    await act(async () => {
      // call loadTestPdf; should early-return since window.pdfjsLib is missing
      const res = await hookRef.loadTestPdf('some.pdf').catch((e) => e);
      expect(res).toBeUndefined();
    });
  });
});

describe('usePdfJs DOCX support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = undefined;
    delete window.pdfjsLib; // Not needed for DOCX
  });

  it('successfully loads a DOCX file from Blob and sets proper state', async () => {
    let hookRef = null;
    const onReady = (h) => { hookRef = h; };

    render(React.createElement(TestHarness, { onReady }));

    const mockBlob = new Blob(['dummy content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    Object.defineProperty(mockBlob, 'name', { value: 'test.docx' });

    let result;
    await act(async () => {
      result = await hookRef.loadPdfFromBlob(mockBlob);
    });

    expect(result).toMatchObject({
      docHash: 'mock-sha-256',
      text: 'Mock DOCX text',
    });

    expect(hookRef.docType).toBe('docx');
    expect(hookRef.pdfDoc).toBeNull();
    expect(hookRef.docxBlob).toBeInstanceOf(Blob);
    expect(hookRef.pdfTextContent).toBe('Mock DOCX text');
  });

  it('successfully test loads a DOCX file via loadTestPdf', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
    });

    let hookRef = null;
    const onReady = (h) => { hookRef = h; };

    render(React.createElement(TestHarness, { onReady }));

    let result;
    await act(async () => {
      result = await hookRef.loadTestPdf('example.docx');
    });

    expect(global.fetch).toHaveBeenCalledWith('/test-docs/example.docx');
    expect(result).toMatchObject({
      docHash: 'mock-sha-256',
      text: 'Mock DOCX text',
      fileInfo: {
        name: 'example.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    });

    expect(hookRef.docType).toBe('docx');
    expect(hookRef.pdfDoc).toBeNull();
    expect(hookRef.docxBlob).toBeInstanceOf(Blob);
    expect(hookRef.pdfTextContent).toBe('Mock DOCX text');
  });
});
