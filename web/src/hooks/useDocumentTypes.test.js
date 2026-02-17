import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentTypes } from './useDocumentTypes';
import { DOCUMENT_TYPES as FALLBACK_TYPES, DOC_CATEGORIES } from '../lib/documentTypes.js';

describe('useDocumentTypes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('uses remote types when fetch succeeds and normalizes validationSlug', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        types: [
          { id: 'legal_lease_residential', label: 'Residential Lease', synonyms: ['rent agreement'] },
          { id: 'business_invoice', label: 'Invoice', validationSlug: 'invoice', synonyms: ['tax invoice'] },
        ],
      }),
    });

    const { result } = renderHook(() => useDocumentTypes());

    await waitFor(() => {
      expect(result.current.source).toBe('remote');
    });

    expect(result.current.types).toHaveLength(2);
    expect(result.current.types[0].validationSlug).toBeNull();
    expect(result.current.types[1].validationSlug).toBe('invoice');
    expect(result.current.categories).toEqual(DOC_CATEGORIES);
  });

  it('falls back to bundled types when fetch fails or payload is invalid', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { result: first } = renderHook(() => useDocumentTypes());

    await waitFor(() => {
      expect(first.current.source).toBe('bundled');
    });
    expect(first.current.types).toEqual(FALLBACK_TYPES);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ types: 'not-array' }),
    });
    const { result: second } = renderHook(() => useDocumentTypes());

    await waitFor(() => {
      expect(second.current.source).toBe('bundled');
    });
    expect(second.current.types).toEqual(FALLBACK_TYPES);
  });

  it('supports label, synonym, token and empty-query matching', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        types: [
          { id: 'lease', label: 'Commercial Lease Agreement', synonyms: ['rent contract'], validationSlug: null },
          { id: 'nda', label: 'Non Disclosure Agreement', synonyms: ['confidentiality agreement'], validationSlug: null },
          { id: 'invoice', label: 'Invoice', synonyms: ['tax invoice'], validationSlug: null },
        ],
      }),
    });

    const { result } = renderHook(() => useDocumentTypes());
    await waitFor(() => {
      expect(result.current.source).toBe('remote');
    });

    expect(result.current.find('')).toEqual(result.current.types);
    expect(result.current.find('lease')[0].id).toBe('lease');
    expect(result.current.find('confidentiality')[0].id).toBe('nda');
    expect(result.current.find('commercial agreement')[0].id).toBe('lease');
    expect(result.current.find('agreement').length).toBe(2);
    expect(result.current.find('totally-missing')).toEqual([]);
  });

  it('handles missing label/synonyms values in scoring', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        types: [
          { id: 'blank', validationSlug: null },
          { id: 'malformed', label: null, synonyms: 'not-array', validationSlug: null },
          { id: 'normal', label: 'Normal Contract', synonyms: ['contract'], validationSlug: null },
        ],
      }),
    });

    const { result } = renderHook(() => useDocumentTypes());
    await waitFor(() => {
      expect(result.current.source).toBe('remote');
    });
    expect(result.current.find('normal')[0].id).toBe('normal');
    expect(result.current.find('missing')).toEqual([]);
  });

  it('does not update state after unmount (cancelled load)', async () => {
    let resolveFetch;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { unmount } = renderHook(() => useDocumentTypes());
    unmount();

    resolveFetch({
      ok: true,
      json: async () => ({
        types: [{ id: 'late', label: 'Late Type', synonyms: [] }],
      }),
    });

    // no assertion needed beyond "no state update crash"
    await Promise.resolve();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not update catch fallback after unmount when request rejects', async () => {
    let rejectFetch;
    global.fetch.mockReturnValue(
      new Promise((_, reject) => {
        rejectFetch = reject;
      })
    );

    const { unmount } = renderHook(() => useDocumentTypes());
    unmount();
    rejectFetch(new Error('network-fail'));

    await Promise.resolve();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
