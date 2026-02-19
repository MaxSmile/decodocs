import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Grid } from 'gridjs-react';

import { db } from '../firebase.js';

const MAX_ROWS = 150;

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? null : asDate;
};

const formatTs = (value) => {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString();
};

export default function AiEventsPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'admin_ai_events'),
        orderBy('createdAt', 'desc'),
        limit(MAX_ROWS)
      );
      const snap = await getDocs(q);
      const next = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setRows(next);
    } catch (e) {
      setError(e?.message || 'Failed to load AI events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>AI Error Events</h1>
          <div style={{ marginTop: 6, color: '#475569', fontSize: 13 }}>
            Last {MAX_ROWS} logged function-side errors (type-specific analysis).
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => nav('/')}
            style={{ borderRadius: 999, border: '1px solid #cbd5e1', background: 'white', padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}
          >
            Back
          </button>
          <button
            onClick={() => load({ isRefresh: true })}
            disabled={refreshing}
            style={{ borderRadius: 999, border: '1px solid #0f172a', background: '#0f172a', color: 'white', padding: '8px 14px', fontWeight: 900, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca' }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>Loading…</div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>No AI events found.</div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <Grid
            data={rows.map((r) => [
              r.createdAt,
              r.model || '—',
              r.eventType || '—',
              r.status ?? '—',
              [r.message, r.docHash ? `docHash:${r.docHash}` : null, r.uid ? `uid:${r.uid}` : null].filter(Boolean).join(' | ') || '—',
            ])}
            columns={[
              { name: 'Time',    width: '170px', formatter: (cell) => formatTs(cell) },
              { name: 'Model',   width: '140px' },
              { name: 'Event',   width: '130px' },
              { name: 'Status',  width: '100px' },
              { name: 'Message' },
            ]}
            sort
            search
            pagination={{ limit: 50 }}
            style={{
              th: { fontSize: '12px', fontWeight: '800', background: '#f8fafc' },
              td: { fontSize: '12px', verticalAlign: 'top' },
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
