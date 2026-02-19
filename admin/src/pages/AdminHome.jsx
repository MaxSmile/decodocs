import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function AdminHome() {
  const { state, logout } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>DecoDocs Admin</h1>
          <div style={{ marginTop: 6, fontSize: 13, color: '#475569' }}>
            Signed in as <strong>{state.user?.email}</strong>
          </div>
        </div>
        <button
          onClick={() => logout()}
          style={{
            borderRadius: 999,
            border: '1px solid #cbd5e1',
            background: 'white',
            padding: '8px 14px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Card title="Stripe" desc="Edit admin/stripe" to="/config/stripe" />
        <Card title="Plans" desc="Edit admin/plans" to="/config/plans" />
        <Card title="Feature flags" desc="Edit admin/flags" to="/config/flags" />
        <Card title="Policies" desc="Edit admin/policies" to="/config/policies" />
        <Card title="Crash & Reports" desc="Manage backend exceptions + user reports" to="/reports" />
        <Card title="AI Error Events" desc="View function-side Gemini failures" to="/ai-events" />
        <Card title="Users" desc="List, disable, enable, delete Firebase Auth users" to="/users" />
      </div>

      <div style={{ marginTop: 18, color: '#64748b', fontSize: 12 }}>
        Note: server-side security is enforced via Firestore Rules (`request.auth.token.email` endsWith @snapsign.com.au).
      </div>
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid #e2e8f0',
        background: 'white',
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6, color: '#475569', fontSize: 13 }}>{desc}</div>
      <div style={{ marginTop: 10, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Open →</div>
    </Link>
  );
}
