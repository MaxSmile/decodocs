import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { JsonEditor } from 'json-edit-react';

import { db, fn } from '../firebase.js';
import { validateConfigDoc } from '../lib/configValidation.js';

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
  const [data, setData] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);

  const ref = useMemo(() => (docId ? doc(db, 'admin', docId) : null), [docId]);
  const saveConfig = useMemo(() => httpsCallable(fn, 'setAdminConfig'), []);
  const validation = useMemo(() => validateConfigDoc(docId, data), [docId, data]);

  useEffect(() => {
    if (!ref) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      setDirty(false);
      try {
        const snap = await getDoc(ref);
        const loaded = snap.exists() ? snap.data() : {};
        if (!active) return;
        setData(loaded);
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

  const handleDataChange = (newData) => {
    setData(newData);
    setDirty(true);
    setSavedAt(null);
  };

  const onSave = async () => {
    if (!ref) return;
    setError(null);
    if (validation.errors.length > 0) {
      setError(`Fix validation errors before saving:\n- ${validation.errors.join('\n- ')}`);
      return;
    }
    setBusy(true);
    try {
      await saveConfig({ docId, config: data, merge: true });
      setSavedAt(new Date());
      setDirty(false);
    } catch (e) {
      const details = e?.details?.errors;
      if (Array.isArray(details) && details.length > 0) {
        setError(`Save blocked by server validation:\n- ${details.join('\n- ')}`);
      } else {
        setError(e?.message || 'Save failed');
      }
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
            Interactive editor — add, edit or delete fields then save. Restricted to @snapsign.com.au.
          </div>
          {savedAt ? (
            <div style={{ marginTop: 6, color: '#16a34a', fontSize: 12 }}>Saved {savedAt.toLocaleString()}</div>
          ) : null}
          {dirty && !savedAt ? (
            <div style={{ marginTop: 6, color: '#d97706', fontSize: 12 }}>Unsaved changes</div>
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
            disabled={busy || loading}
            style={{ borderRadius: 999, border: dirty ? '1px solid #0f172a' : '1px solid #cbd5e1', background: dirty ? '#0f172a' : '#f8fafc', color: dirty ? 'white' : '#94a3b8', padding: '8px 14px', fontWeight: 900, cursor: busy || loading ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca', whiteSpace: 'pre-wrap' }}>
          {error}
        </div>
      ) : null}

      {!loading && validation.errors.length > 0 ? (
        <div style={{ marginTop: 10, color: '#991b1b', fontSize: 12, background: '#fef2f2', padding: 8, borderRadius: 8, border: '1px solid #fecaca' }}>
          Validation errors: {validation.errors.join(' | ')}
        </div>
      ) : null}

      {!loading && validation.warnings.length > 0 ? (
        <div style={{ marginTop: 10, color: '#92400e', fontSize: 12, background: '#fffbeb', padding: 8, borderRadius: 8, border: '1px solid #fde68a' }}>
          Hints: {validation.warnings.join(' | ')}
        </div>
      ) : null}

      <div style={{ marginTop: 14, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', minHeight: 200 }}>
        {loading ? (
          <div style={{ padding: 20, color: '#64748b', fontSize: 13 }}>Loading…</div>
        ) : (
          <JsonEditor
            data={data}
            setData={handleDataChange}
            rootName={`admin/${docId}`}
            indent={3}
            collapse={1}
            enableClipboard
            showCollectionCount="when-closed"
            theme={{
              container: {
                backgroundColor: '#ffffff',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '13px',
                padding: '12px',
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
