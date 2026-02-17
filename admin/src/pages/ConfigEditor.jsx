import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../firebase.js';

const CONFIG_MAP = {
  stripe: 'stripe',
  plans: 'plans',
  flags: 'flags',
  policies: 'policies',
};

export default function ConfigEditor() {
  const { key } = useParams();
  const nav = useNavigate();
  const docId = CONFIG_MAP[key];

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [raw, setRaw] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  const ref = useMemo(() => (docId ? doc(db, 'admin', docId) : null), [docId]);

  useEffect(() => {
    if (!ref) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        if (!active) return;
        setRaw(JSON.stringify(data, null, 2));
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to load config');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ref]);

  const onSave = async () => {
    if (!ref) return;
    setError(null);
    setBusy(true);
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      await setDoc(ref, { ...parsed, updatedAt: serverTimestamp() }, { merge: true });
      setSavedAt(new Date());
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  if (!docId) {
    return (
      <div style={{ maxWidth: 900, margin: '30px auto', padding: 24 }}>
        <h1 style={{ margin: 0 }}>Unknown config</h1>
        <button onClick={() => nav('/')} style={{ marginTop: 12 }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>admin/{docId}</h1>
          <div style={{ marginTop: 6, color: '#475569', fontSize: 13 }}>
            Edit JSON and save. Firestore rules restrict access to @snapsign.com.au accounts.
          </div>
          {savedAt ? (
            <div style={{ marginTop: 6, color: '#16a34a', fontSize: 12 }}>Saved {savedAt.toLocaleString()}</div>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => nav('/')}
            style={{ borderRadius: 999, border: '1px solid #cbd5e1', background: 'white', padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}
          >
            Back
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            style={{ borderRadius: 999, border: '1px solid #0f172a', background: '#0f172a', color: 'white', padding: '8px 14px', fontWeight: 900, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca' }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 520,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 12,
            lineHeight: 1.5,
            padding: 12,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            outline: 'none',
            background: '#fff',
          }}
          disabled={loading}
        />
      </div>

      {loading ? <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>Loading…</div> : null}
    </div>
  );
}
