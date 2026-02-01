import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DOCUMENT_TYPES, DOC_CATEGORIES, findDocumentTypes } from '../lib/documentTypes.js';

const groupLabel = (cat) => {
  if (cat === DOC_CATEGORIES.BUSINESS_LEGAL) return 'Business & legal';
  if (cat === DOC_CATEGORIES.GENERAL) return 'General documents';
  if (cat === DOC_CATEGORIES.UNREADABLE) return 'Unreadable / special cases';
  return 'Other';
};

export default function DocumentTypeSelector({
  open,
  onClose,
  detectedType,
  onPick,
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const r = findDocumentTypes(query);
    // If empty query, keep it bounded to avoid overwhelming the modal.
    return query ? r.slice(0, 30) : DOCUMENT_TYPES.slice(0, 25);
  }, [query]);

  const grouped = useMemo(() => {
    const m = new Map();
    for (const t of results) {
      const k = t.category;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(t);
    }
    return Array.from(m.entries());
  }, [results]);

  const flat = useMemo(() => results, [results]);

  const pickByIndex = (idx) => {
    const t = flat[idx];
    if (!t) return;
    onPick?.(t);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose?.();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pickByIndex(activeIndex);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: 16,
      }}
      onClick={() => onClose?.()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          maxWidth: 760,
          width: '100%',
          padding: 18,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>Change document type</div>
            <div style={{ marginTop: 6, color: '#475569', lineHeight: 1.4 }}>
              We use this to decide which actions/checks to show. You can override the AI classification.
            </div>
            {detectedType && (
              <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
                Detected: <strong>{detectedType.label}</strong>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#0f172a',
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          placeholder="Start typing (e.g. lease, invoice, police letter)…"
          style={{
            marginTop: 14,
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        />

        <div style={{ marginTop: 14, maxHeight: 360, overflow: 'auto' }}>
          {grouped.map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 13, marginBottom: 8 }}>
                {groupLabel(cat)}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {items.map((t) => {
                  const idx = flat.findIndex((x) => x.id === t.id);
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onPick?.(t)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid ' + (active ? '#0f172a' : '#e2e8f0'),
                        background: active ? '#f8fafc' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 900, color: '#0f172a' }}>{t.label}</div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{t.id}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!grouped.length && (
            <div style={{ color: '#64748b' }}>No matches.</div>
          )}
        </div>
      </div>
    </div>
  );
}
