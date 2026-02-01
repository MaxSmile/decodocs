import { useEffect, useMemo, useState } from 'react';
import { DOCUMENT_TYPES as FALLBACK_TYPES, DOC_CATEGORIES } from '../lib/documentTypes.js';

// Loads the typeahead index from static Hosting assets.
// Falls back to the bundled list if the fetch fails.
export function useDocumentTypes() {
  const [remoteTypes, setRemoteTypes] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const resp = await fetch('/classifications/document-types.index.json', { cache: 'force-cache' });
        if (!resp.ok) throw new Error(`Failed to load document types: ${resp.status}`);
        const json = await resp.json();
        const types = Array.isArray(json?.types) ? json.types : null;
        if (!types) throw new Error('Invalid document-types.index.json');
        if (!cancelled) setRemoteTypes(types);
      } catch {
        if (!cancelled) setRemoteTypes(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => {
    if (Array.isArray(remoteTypes) && remoteTypes.length) return remoteTypes;
    return FALLBACK_TYPES;
  }, [remoteTypes]);

  const find = useMemo(() => {
    return (query) => {
      const q = String(query || '').trim().toLowerCase();
      if (!q) return types;

      const score = (t) => {
        const label = String(t.label || '').toLowerCase();
        const syn = Array.isArray(t.synonyms) ? t.synonyms.join(' ').toLowerCase() : '';
        if (label.includes(q)) return 100;
        if (syn.includes(q)) return 80;
        const tokens = q.split(/\s+/).filter(Boolean);
        if (tokens.length && tokens.every((tok) => label.includes(tok) || syn.includes(tok))) return 60;
        return 0;
      };

      return types
        .map((t) => ({ t, s: score(t) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.t);
    };
  }, [types]);

  const categories = DOC_CATEGORIES;

  return { types, find, categories, source: Array.isArray(remoteTypes) && remoteTypes.length ? 'remote' : 'bundled' };
}
