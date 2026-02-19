import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { Grid } from 'gridjs-react';
import { h } from 'gridjs';

import { fn } from '../firebase.js';

const listUsersCallable    = (functions) => httpsCallable(functions, 'adminListUsers');
const updateUserCallable   = (functions) => httpsCallable(functions, 'adminUpdateUser');
const deleteUserCallable   = (functions) => httpsCallable(functions, 'adminDeleteUser');

const formatTs = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export default function UsersPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);

  const listUsers    = useMemo(() => listUsersCallable(fn), []);
  const updateUser   = useMemo(() => updateUserCallable(fn), []);
  const deleteUser   = useMemo(() => deleteUserCallable(fn), []);

  const load = useCallback(async ({ isRefresh = false, pageToken = null } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await listUsers({ pageToken });
      const { users, nextPageToken: next } = result.data;
      setRows(isRefresh || !pageToken ? users : (prev) => [...prev, ...users]);
      setNextPageToken(next || null);
    } catch (e) {
      setError(e?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [listUsers]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleDisabled = async (uid, currentlyDisabled) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await updateUser({ uid, disabled: !currentlyDisabled });
      setRows((prev) => prev.map((u) => u.uid === uid ? { ...u, disabled: !currentlyDisabled } : u));
      setSuccessMsg(`User ${uid} ${!currentlyDisabled ? 'disabled' : 'enabled'}.`);
    } catch (e) {
      setError(e?.message || 'Failed to update user.');
    }
  };

  const handleDelete = async (uid, email) => {
    if (!window.confirm(`Permanently delete user ${email || uid}? This cannot be undone.`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteUser({ uid });
      setRows((prev) => prev.filter((u) => u.uid !== uid));
      setSuccessMsg(`User ${email || uid} deleted.`);
    } catch (e) {
      setError(e?.message || 'Failed to delete user.');
    }
  };

  // Stable action refs to avoid stale closure in gridjs formatters
  const rowsRef = { current: rows };
  rowsRef.current = rows;

  const columns = useMemo(() => [
    { id: 'uid',           name: 'UID',          hidden: true },
    { id: 'email',         name: 'Email',         width: '220px' },
    { id: 'displayName',   name: 'Display Name',  width: '160px', formatter: (c) => c || '—' },
    { id: 'emailVerified', name: 'Verified',      width: '80px',  formatter: (c) => c ? '✓' : '✗' },
    { id: 'disabled',      name: 'Status',        width: '90px',  formatter: (c) => c ? '🔴 Disabled' : '🟢 Active' },
    { id: 'createdAt',     name: 'Created',       width: '150px', formatter: (c) => formatTs(c) },
    { id: 'lastSignInAt',  name: 'Last sign-in',  width: '150px', formatter: (c) => formatTs(c) },
    {
      id: 'actions',
      name: 'Actions',
      width: '180px',
      sort: false,
      formatter: (_, row) => {
        const uid = row.cells[0].data;
        const email = row.cells[1].data;
        const disabled = Boolean(row.cells[4].data); // raw boolean from gridData
        return h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, [
          h('button', {
            style: 'border-radius:999px;border:1px solid #cbd5e1;background:white;padding:2px 8px;font-size:11px;cursor:pointer',
            onClick: () => handleToggleDisabled(uid, disabled),
          }, disabled ? 'Enable' : 'Disable'),
          h('button', {
            style: 'border-radius:999px;border:1px solid #ef4444;background:white;color:#ef4444;padding:2px 8px;font-size:11px;cursor:pointer',
            onClick: () => handleDelete(uid, email),
          }, 'Delete'),
        ]);
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const gridData = rows.map((u) => [
    u.uid,
    u.email || '—',
    u.displayName,
    u.emailVerified,
    u.disabled,
    u.createdAt,
    u.lastSignInAt,
    null, // actions column placeholder
  ]);

  return (
    <div style={{ maxWidth: 1200, margin: '30px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Users</h1>
          <div style={{ marginTop: 6, color: '#475569', fontSize: 13 }}>
            All Firebase Auth users ({rows.length}{nextPageToken ? '+' : ''} loaded). Disable, enable, or delete accounts.
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
          {nextPageToken ? (
            <button
              onClick={() => load({ pageToken: nextPageToken })}
              disabled={loading}
              style={{ borderRadius: 999, border: '1px solid #0f172a', background: 'white', color: '#0f172a', padding: '8px 14px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              Load more
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca' }}>
          {error}
        </div>
      ) : null}

      {successMsg ? (
        <div style={{ marginTop: 12, color: '#166534', fontSize: 13, background: '#f0fdf4', padding: 10, borderRadius: 10, border: '1px solid #bbf7d0' }}>
          {successMsg}
        </div>
      ) : null}

      {loading ? (
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>Loading…</div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>No users found.</div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <Grid
            key={rows.map((u) => u.uid + String(u.disabled)).join(',')}
            data={gridData}
            columns={columns}
            sort
            search
            pagination={{ limit: 25 }}
            style={{
              th: { fontSize: '12px', fontWeight: '800', background: '#f8fafc' },
              td: { fontSize: '12px', verticalAlign: 'middle' },
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
