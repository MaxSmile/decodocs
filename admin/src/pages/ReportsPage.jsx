import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Grid } from 'gridjs-react';
import { h } from 'gridjs';

import { db } from '../firebase.js';
import { useAuth } from '../AuthContext.jsx';

const MAX_ROWS = 200;
const STATUS_OPTIONS = ['open', 'triaged', 'resolved', 'ignored'];

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

export default function ReportsPage() {
  const nav = useNavigate();
  const { state } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'admin_reports'),
        orderBy('createdAt', 'desc'),
        limit(MAX_ROWS)
      );
      const snap = await getDocs(q);
      const next = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setRows(next);
    } catch (e) {
      setError(e?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => rows.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    if (typeFilter !== 'all' && row.reportType !== typeFilter) return false;
    return true;
  }), [rows, statusFilter, typeFilter]);

  const reportTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.reportType).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows]);

  const setStatus = async (rowId, status) => {
    try {
      const email = state.user?.email || null;
      await updateDoc(doc(db, 'admin_reports', rowId), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: email,
      });
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, status } : r)));
    } catch (e) {
      setError(e?.message || 'Failed to update status.');
    }
  };

  // Keep a stable ref so gridjs formatters always call the latest version
  const setStatusRef = useRef(setStatus);
  useEffect(() => { setStatusRef.current = setStatus; });

  const columns = useMemo(() => [
    { id: 'rowid',      name: 'ID',      hidden: true },
    { id: 'createdAt',  name: 'Time',    width: '160px', formatter: (cell) => formatTs(cell) },
    { id: 'reportType', name: 'Type',    width: '120px' },
    {
      id: 'status',
      name: 'Status',
      width: '140px',
      formatter: (cell, row) => h('select', {
        defaultValue: cell || 'open',
        onChange: (e) => setStatusRef.current(row.cells[0].data, e.target.value),
        style: 'border:1px solid #cbd5e1;border-radius:6px;padding:2px 4px;font-size:11px;cursor:pointer',
      }, STATUS_OPTIONS.map((s) => h('option', { value: s }, s))),
    },
    {
      id: 'details',
      name: 'Details',
      formatter: (cell) => cell,
    },
  ], []);

  return (
    <div style={{ maxWidth: 1180, margin: '30px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Crash & User Reports</h1>
          <div style={{ marginTop: 6, color: '#475569', fontSize: 13 }}>
            Backend exceptions, bug reports, and feedback. Most recent {MAX_ROWS} rows.
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

      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px' }}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px' }}>
          {reportTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca' }}>
          {error}
        </div>
      ) : null}

      {loading ? <div style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>Loading…</div> : null}
      {!loading && filtered.length === 0 ? <div style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>No reports found.</div> : null}

      {!loading && filtered.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <Grid
            key={filtered.map((r) => r.id + (r.status || 'open')).join(',')}
            data={filtered.map((r) => [
              r.id,
              r.createdAt,
              r.reportType || '—',
              r.status || 'open',
              [r.message, r.functionName, r.uid, r.pageUrl].filter(Boolean).join(' │ ') || '—',
            ])}
            columns={columns}
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
