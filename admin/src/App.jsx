import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AccessDenied from './pages/AccessDenied.jsx';
import AdminHome from './pages/AdminHome.jsx';
import ConfigEditor from './pages/ConfigEditor.jsx';

function RequireSignedIn({ children }) {
  const { state } = useAuth();

  if (state.status === 'pending') return <div style={{ padding: 24 }}>Loading…</div>;
  if (state.status === 'error') return <div style={{ padding: 24 }}>Auth error: {String(state.error?.message || state.error)}</div>;
  if (state.status === 'signed_out') return <Navigate to="/login" replace />;

  return children;
}

function RequireAdmin({ children }) {
  const { state, isAdmin } = useAuth();
  const email = state.user?.email || '';
  if (!isAdmin(email)) return <Navigate to="/denied" replace />;
  return children;
}

export default function App() {
  const { state, isAdmin } = useAuth();

  const authedAdmin = state.status === 'signed_in' && isAdmin(state.user?.email);

  return (
    <Routes>
      <Route path="/login" element={state.status === 'signed_in' ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={state.status === 'signed_in' ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/denied" element={<RequireSignedIn><AccessDenied /></RequireSignedIn>} />

      <Route
        path="/"
        element={
          <RequireSignedIn>
            {authedAdmin ? <AdminHome /> : <Navigate to="/denied" replace />}
          </RequireSignedIn>
        }
      />

      <Route
        path="/config/:key"
        element={
          <RequireSignedIn>
            <RequireAdmin>
              <ConfigEditor />
            </RequireAdmin>
          </RequireSignedIn>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
