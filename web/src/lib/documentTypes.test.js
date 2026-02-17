import { describe, it, expect } from 'vitest';
import { DOCUMENT_TYPES, findDocumentTypes } from './documentTypes';

describe('findDocumentTypes', () => {
  it('returns full list when query empty', () => {
    const out = findDocumentTypes('');
    expect(out.length).toBe(DOCUMENT_TYPES.length);
  });

  it('matches by label (100 score)', () => {
    const out = findDocumentTypes('Resume / CV');
    // should find resume item
    expect(out.some((t) => t.id === 'general_resume_cv')).toBe(true);
  });

  it('matches by synonym (80 score)', () => {
    const out = findDocumentTypes('invoice');
    expect(out[0].id).toBe('business_invoice');
  });

  it('matches fuzzy tokens (60 score)', () => {
    const out = findDocumentTypes('term conditions');
    // should match terms of service
    expect(out.some((t) => t.id === 'policy_terms')).toBe(true);
  });

  it('returns empty array when no matches', () => {
    const out = findDocumentTypes('qwerty-unknown-term');
    expect(out.length).toBe(0);
  });
});
