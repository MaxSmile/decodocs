import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentAnalysis } from './useDocumentAnalysis';
import { analyzeByTypeCall } from '../services/typeAnalysisService';
import { preflightCheckCall } from '../services/preflightService';
import { analyzeTextCall } from '../services/analyzeTextService';
import { explainSelectionCall, highlightRisksCall, translateToPlainEnglishCall } from '../services/analysisService';
import { buildDocStats } from '../utils/docStats';

vi.mock('../services/typeAnalysisService', () => ({ analyzeByTypeCall: vi.fn() }));
vi.mock('../services/preflightService', () => ({ preflightCheckCall: vi.fn() }));
vi.mock('../services/analyzeTextService', () => ({ analyzeTextCall: vi.fn() }));
vi.mock('../services/analysisService', () => ({
  explainSelectionCall: vi.fn(),
  highlightRisksCall: vi.fn(),
  translateToPlainEnglishCall: vi.fn(),
}));
vi.mock('../utils/docStats', () => ({ buildDocStats: vi.fn() }));

const DOC = { id: 'doc-1', size: 12345 };
const DOC_HASH = 'a'.repeat(64);
const PDF_TEXT = 'Page One\fPage Two';

const buildAnalyzeOk = () => ({
  data: {
    ok: true,
    result: {
      plainExplanation: 'Plain summary',
      risks: [
        {
          id: 'R1',
          title: 'Liability',
          severity: 'high',
          whyItMatters: 'Could increase exposure',
          whatToCheck: ['Cap liability'],
        },
      ],
    },
  },
});

const setupHook = (overrides = {}) => {
  const args = {
    functions: {},
    authState: { status: 'authenticated' },
    isMockMode: false,
    ...overrides,
  };
  return renderHook(() => useDocumentAnalysis(args));
};

describe('useDocumentAnalysis', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    buildDocStats.mockReturnValue({
      charsPerPage: [8, 8],
      totalChars: 16,
    });
    preflightCheckCall.mockResolvedValue({ ok: true, classification: 'OK' });
    analyzeTextCall.mockResolvedValue(buildAnalyzeOk());
    analyzeByTypeCall.mockResolvedValue({
      ok: true,
      effectiveTypeId: 'legal_contract_generic',
      validationSlug: 'contract',
      validationSpec: { title: 'Contract Spec' },
      message: 'Done',
      result: { plainExplanation: 'Type-specific output', extracted: {}, checks: [] },
      usage: { estimatedTokens: 100, remainingTokens: 500 },
    });
    explainSelectionCall.mockResolvedValue({
      ok: true,
      explanation: { plainExplanation: 'Explained' },
    });
    highlightRisksCall.mockResolvedValue({
      ok: true,
      risks: {
        summary: { totalRisks: 2 },
        items: [
          { severity: 'high', description: 'A', explanation: 'AA' },
          { severity: 'medium', description: 'B', explanation: 'BB' },
        ],
      },
    });
    translateToPlainEnglishCall.mockResolvedValue({
      ok: true,
      translation: {
        originalText: 'Original',
        plainEnglishTranslation: 'Plain',
      },
    });
  });

  it('exposes initial state', () => {
    const { result } = setupHook();
    expect(result.current.analysisResults).toEqual({});
    expect(result.current.gate).toBeNull();
    expect(result.current.dialog).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('handles analyzeByType unavailable/missing/mock/success/error branches', async () => {
    const { result: missing } = setupHook();
    await act(async () => {
      await missing.current.handleAnalyzeByType({ selectedDocument: null, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(analyzeByTypeCall).not.toHaveBeenCalled();

    const { result: unavailable } = setupHook({ functions: null, authState: { status: 'unauthenticated' } });
    await act(async () => {
      await unavailable.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(console.warn).toHaveBeenCalledWith('Type-specific analysis unavailable: Firebase services not accessible.');

    const { result: mockMode } = setupHook({ functions: null, isMockMode: true });
    await act(async () => {
      await mockMode.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(mockMode.current.dialog.title).toBe('Type-specific analysis (beta)');
    expect(mockMode.current.analysisResults[DOC.id]._meta.status).toBe('error');

    const { result: okMode } = setupHook();
    await act(async () => {
      await okMode.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(analyzeByTypeCall).toHaveBeenCalledWith({ functions: {}, docHash: DOC_HASH, text: PDF_TEXT });
    expect(okMode.current.analysisResults[DOC.id].typeSpecific.validationTitle).toBe('Contract Spec');
    expect(okMode.current.gate).toBeNull();

    analyzeByTypeCall.mockResolvedValueOnce({
      ok: true,
      effectiveTypeId: 'general_letter',
      validationSlug: 'letter',
    });
    await act(async () => {
      await okMode.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(okMode.current.analysisResults[DOC.id].typeSpecific.effectiveTypeId).toBe('general_letter');

    analyzeByTypeCall.mockResolvedValueOnce(undefined);
    await act(async () => {
      await okMode.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(okMode.current.analysisResults[DOC.id].typeSpecific.ok).toBe(false);
    expect(okMode.current.gate).toBeNull();

    analyzeByTypeCall.mockRejectedValueOnce(new Error('type failure'));
    await act(async () => {
      await okMode.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(okMode.current.analysisResults[DOC.id]._meta.status).toBe('error');
    expect(okMode.current.dialog.title).toBe('Type-specific analysis failed');

    analyzeByTypeCall.mockRejectedValueOnce({});
    await act(async () => {
      await okMode.current.handleAnalyzeByType({ selectedDocument: DOC, pdfTextContent: PDF_TEXT, docHash: DOC_HASH });
    });
    expect(okMode.current.dialog.message).toBe('Request failed.');
  });

  it('handles analyzeDocument guard/unavailable/preflight failure/pro-required branches', async () => {
    const { result: hook } = setupHook();

    await act(async () => {
      await hook.current.handleAnalyzeDocument({
        selectedDocument: null,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(preflightCheckCall).not.toHaveBeenCalled();

    const { result: unavailable } = setupHook({ functions: null, authState: { status: 'unauthenticated' } });
    await act(async () => {
      await unavailable.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(console.warn).toHaveBeenCalledWith('Document analysis unavailable: Firebase services not accessible.');

    preflightCheckCall.mockResolvedValueOnce({ ok: false, message: 'Nope' });
    await act(async () => {
      await hook.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(hook.current.dialog.title).toBe('Analysis failed');
    expect(hook.current.analysisResults[DOC.id]._meta.message).toContain('Nope');

    preflightCheckCall.mockResolvedValueOnce({ ok: false });
    await act(async () => {
      await hook.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(hook.current.analysisResults[DOC.id]._meta.message).toContain('Preflight check failed');

    preflightCheckCall.mockResolvedValueOnce({
      ok: true,
      classification: 'PRO_REQUIRED',
      reasons: [{ message: 'OCR required' }, { message: 'Large PDF' }],
    });
    await act(async () => {
      await hook.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(hook.current.gate.title).toBe('Pro required');
    expect(hook.current.analysisResults[DOC.id]._meta.message).toContain('OCR required');

    preflightCheckCall.mockResolvedValueOnce({
      ok: true,
      classification: 'PRO_REQUIRED',
    });
    await act(async () => {
      await hook.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(hook.current.analysisResults[DOC.id]._meta.message).toContain('requires Pro features');
  });

  it('handles analyzeDocument success path including updateAnnotations and no-update case', async () => {
    const updateAnnotations = vi.fn();
    const { result } = setupHook();

    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
        updateAnnotations,
      });
    });

    expect(buildDocStats).toHaveBeenCalled();
    expect(result.current.analysisResults[DOC.id].summary).toBe('Plain summary');
    expect(result.current.analysisResults[DOC.id].risks[0].riskLevel).toBe('high');
    expect(result.current.analysisResults[DOC.id].recommendations).toEqual(['Cap liability']);
    expect(updateAnnotations).toHaveBeenCalledTimes(1);
    expect(result.current.gate).toBeNull();

    analyzeTextCall.mockResolvedValueOnce({
      data: {
        ok: true,
        result: {
          plainExplanation: 'No checks',
          risks: [
            {
              id: 'R2',
              title: 'Other',
              severity: 'medium',
              whyItMatters: 'something',
              whatToCheck: null,
            },
          ],
        },
      },
    });
    const docWithoutSize = { id: 'doc-2' };
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: docWithoutSize,
        pdfTextContent: PDF_TEXT,
        docHash: 'b'.repeat(64),
        numPages: 2,
      });
    });
    expect(result.current.analysisResults[docWithoutSize.id].risks[0].explanation).toBe('');
    expect(result.current.analysisResults[docWithoutSize.id].recommendations).toEqual([]);
    expect(buildDocStats).toHaveBeenCalledWith(
      expect.objectContaining({ pdfSizeBytes: 0 })
    );

    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 0,
      });
    });
    expect(analyzeTextCall).toHaveBeenCalled();
  });

  it('handles analyzeDocument non-ok code branches and unknown failure', async () => {
    const { result } = setupHook();

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'SCAN_DETECTED_PRO_REQUIRED', message: 'Scanned PDF' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.gate.title).toContain('Scanned PDF');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'SCAN_DETECTED_PRO_REQUIRED' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.gate.message).toContain('appears to be scanned');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'ANON_TOKEN_LIMIT', message: 'Anon blocked' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.dialog.title).toBe('Limit reached');
    expect(result.current.dialog.message).toBe('Anon blocked');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'ANON_TOKEN_LIMIT' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.dialog.message).toContain('Anonymous token limit reached');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'FREE_TOKEN_LIMIT', message: 'Free blocked' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.gate.title).toBe('Daily limit reached');
    expect(result.current.gate.message).toBe('Free blocked');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'FREE_TOKEN_LIMIT' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.gate.message).toContain('Daily token limit reached');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'SOMETHING_ELSE', message: 'Other fail' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.dialog.title).toBe('Analysis failed');
    expect(result.current.analysisResults[DOC.id]._meta.message).toBe('Other fail');

    analyzeTextCall.mockResolvedValueOnce({
      data: { ok: false, code: 'SOMETHING_ELSE' },
    });
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.analysisResults[DOC.id]._meta.message).toBe('Analysis failed');

    analyzeTextCall.mockRejectedValueOnce({});
    await act(async () => {
      await result.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(result.current.analysisResults[DOC.id]._meta.message).toBe('Analysis failed.');
    expect(result.current.dialog.message).toBe('Request failed.');
  });

  it('handles analyzeDocument mock-mode fetch and preflight catch fallback', async () => {
    const { result: mockMode } = setupHook({ functions: null, isMockMode: true });

    global.fetch.mockResolvedValue({
      json: async () => buildAnalyzeOk().data,
    });

    await act(async () => {
      await mockMode.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/analyzeText',
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockMode.current.analysisResults[DOC.id].summary).toBe('Plain summary');

    const { result: preflightErr } = setupHook();
    preflightCheckCall.mockRejectedValueOnce(new Error('preflight exploded'));
    await act(async () => {
      await preflightErr.current.handleAnalyzeDocument({
        selectedDocument: DOC,
        pdfTextContent: PDF_TEXT,
        docHash: DOC_HASH,
        numPages: 2,
      });
    });
    expect(console.error).toHaveBeenCalledWith('Preflight check error:', expect.any(Error));
    expect(preflightErr.current.analysisResults[DOC.id]._meta.status).toBe('success');
  });

  it('handles explainSelection branches', async () => {
    const { result } = setupHook();

    await act(async () => {
      await result.current.handleExplainSelection({ selectedDocument: null, docHash: DOC_HASH, pdfTextContent: PDF_TEXT });
    });
    expect(explainSelectionCall).not.toHaveBeenCalled();

    const { result: unavailable } = setupHook({ functions: null, authState: { status: 'unauthenticated' } });
    await act(async () => {
      await unavailable.current.handleExplainSelection({ selectedDocument: DOC, docHash: DOC_HASH, pdfTextContent: PDF_TEXT });
    });
    expect(console.warn).toHaveBeenCalledWith('Explain selection unavailable: Firebase services not accessible.');

    await act(async () => {
      await result.current.handleExplainSelection({ selectedDocument: DOC, docHash: DOC_HASH, pdfTextContent: PDF_TEXT, selection: null });
    });
    expect(result.current.dialog.title).toBe('No selection');

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true, explanation: { plainExplanation: 'Mock explain' } }),
    });
    const { result: mockMode } = setupHook({ functions: null, isMockMode: true });
    await act(async () => {
      await mockMode.current.handleExplainSelection({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
        selection: { text: 'Clause text' },
      });
    });
    expect(mockMode.current.dialog.title).toBe('Explanation');
    expect(mockMode.current.dialog.message).toBe('Mock explain');

    explainSelectionCall.mockResolvedValueOnce({ ok: false, error: 'Explain failed' });
    let thrown = null;
    await act(async () => {
      try {
        await result.current.handleExplainSelection({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
          selection: { text: 'Clause text' },
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('Explain failed');

    explainSelectionCall.mockResolvedValueOnce({ ok: false });
    thrown = null;
    await act(async () => {
      try {
        await result.current.handleExplainSelection({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
          selection: { text: 'Clause text' },
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('Explanation failed');

    explainSelectionCall.mockRejectedValueOnce(new Error('service exploded'));
    thrown = null;
    await act(async () => {
      try {
        await result.current.handleExplainSelection({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
          selection: { text: 'Clause text' },
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('service exploded');
  });

  it('handles highlightRisks branches', async () => {
    const { result } = setupHook();
    const setRiskBadges = vi.fn();

    await act(async () => {
      await result.current.handleHighlightRisks({
        selectedDocument: null,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
        setRiskBadges,
      });
    });
    expect(setRiskBadges).not.toHaveBeenCalled();

    const { result: unavailable } = setupHook({ functions: null, authState: { status: 'unauthenticated' } });
    await act(async () => {
      await unavailable.current.handleHighlightRisks({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
        setRiskBadges,
      });
    });
    expect(console.warn).toHaveBeenCalledWith('Risk highlighting unavailable: Firebase services not accessible.');

    await act(async () => {
      await result.current.handleHighlightRisks({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
        setRiskBadges,
      });
    });
    expect(result.current.dialog.title).toBe('Risk scan complete');
    expect(result.current.dialog.message).toBe('Found 2 risks in the document.');
    expect(setRiskBadges.mock.calls.at(-1)[0][0].level).toBe('high');

    highlightRisksCall.mockResolvedValueOnce({
      ok: true,
      risks: { summary: { totalRisks: 0 }, items: null },
    });
    await act(async () => {
      await result.current.handleHighlightRisks({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
        setRiskBadges,
      });
    });
    expect(setRiskBadges.mock.calls.at(-1)[0]).toEqual([]);

    highlightRisksCall.mockResolvedValueOnce({ ok: false, error: 'Risk failed' });
    let thrown = null;
    await act(async () => {
      try {
        await result.current.handleHighlightRisks({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
          setRiskBadges,
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('Risk failed');

    highlightRisksCall.mockResolvedValueOnce({ ok: false });
    thrown = null;
    await act(async () => {
      try {
        await result.current.handleHighlightRisks({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
          setRiskBadges,
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('Risk highlighting failed');

    highlightRisksCall.mockRejectedValueOnce(new Error('risk boom'));
    thrown = null;
    await act(async () => {
      try {
        await result.current.handleHighlightRisks({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
          setRiskBadges,
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('risk boom');

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true, risks: { summary: { totalRisks: 1 }, items: [{ severity: 'low', description: 'C', explanation: 'CC' }] } }),
    });
    const { result: mockMode } = setupHook({ functions: null, isMockMode: true });
    await act(async () => {
      await mockMode.current.handleHighlightRisks({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
        setRiskBadges,
      });
    });
    expect(global.fetch).toHaveBeenCalledWith('/highlightRisks', expect.objectContaining({ method: 'POST' }));
  });

  it('handles translateToPlainEnglish branches', async () => {
    const { result } = setupHook();

    await act(async () => {
      await result.current.handleTranslateToPlainEnglish({
        selectedDocument: null,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
      });
    });
    expect(translateToPlainEnglishCall).not.toHaveBeenCalled();

    const { result: unavailable } = setupHook({ functions: null, authState: { status: 'unauthenticated' } });
    await act(async () => {
      await unavailable.current.handleTranslateToPlainEnglish({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
      });
    });
    expect(console.warn).toHaveBeenCalledWith('Translation unavailable: Firebase services not accessible.');

    await act(async () => {
      await result.current.handleTranslateToPlainEnglish({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: `${'x'.repeat(700)}-tail`,
      });
    });
    expect(result.current.dialog.title).toBe('Plain English translation');
    expect(result.current.dialog.message).toBe('Original: Original\n\nPlain English: Plain');
    expect(translateToPlainEnglishCall).toHaveBeenCalledWith(
      expect.objectContaining({
        legalText: expect.any(String),
      })
    );
    expect(translateToPlainEnglishCall.mock.calls[0][0].legalText.length).toBe(500);

    translateToPlainEnglishCall.mockResolvedValueOnce({ ok: false, error: 'Translate failed' });
    let thrown = null;
    await act(async () => {
      try {
        await result.current.handleTranslateToPlainEnglish({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('Translate failed');

    translateToPlainEnglishCall.mockResolvedValueOnce({ ok: false });
    thrown = null;
    await act(async () => {
      try {
        await result.current.handleTranslateToPlainEnglish({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('Translation failed');

    translateToPlainEnglishCall.mockRejectedValueOnce(new Error('translate boom'));
    thrown = null;
    await act(async () => {
      try {
        await result.current.handleTranslateToPlainEnglish({
          selectedDocument: DOC,
          docHash: DOC_HASH,
          pdfTextContent: PDF_TEXT,
        });
      } catch (e) {
        thrown = e;
      }
    });
    expect(thrown.message).toContain('translate boom');

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true, translation: { originalText: 'O', plainEnglishTranslation: 'P' } }),
    });
    const { result: mockMode } = setupHook({ functions: null, isMockMode: true });
    await act(async () => {
      await mockMode.current.handleTranslateToPlainEnglish({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
      });
    });
    expect(global.fetch).toHaveBeenCalledWith('/translateToPlainEnglish', expect.objectContaining({ method: 'POST' }));
  });

  it('routes summarize/suggest handlers through analyze flow', async () => {
    const { result } = setupHook();

    await act(async () => {
      await result.current.handleSummarizeKeyPoints({ selectedDocument: null, docHash: DOC_HASH, pdfTextContent: PDF_TEXT });
      await result.current.handleSuggestImprovements({ selectedDocument: DOC, docHash: null, pdfTextContent: PDF_TEXT });
    });
    expect(analyzeTextCall).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleSummarizeKeyPoints({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
      });
    });
    await waitFor(() => {
      expect(analyzeTextCall).toHaveBeenCalled();
    });
    const summarizePayload = analyzeTextCall.mock.calls.at(-1)[0].payload;
    expect(summarizePayload.stats.pageCount).toBe(1);

    await act(async () => {
      await result.current.handleSuggestImprovements({
        selectedDocument: DOC,
        docHash: DOC_HASH,
        pdfTextContent: PDF_TEXT,
      });
    });
    const suggestPayload = analyzeTextCall.mock.calls.at(-1)[0].payload;
    expect(suggestPayload.stats.pageCount).toBe(1);
  });
});
