import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage.jsx';
import DocumentViewer from './components/DocumentViewer.jsx';
import DocumentEditor from './components/DocumentEditor.jsx';
import AboutPage from './components/AboutPage.jsx';
import PrivacyPage from './components/PrivacyPage.jsx';
import TermsPage from './components/TermsPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import PricingPage from './components/PricingPage.jsx';
import SignInPage from './components/SignInPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthErrorNotification from './components/AuthErrorNotification.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './App.css';

// "Sign" roadmap page
// This intentionally shows the concrete checklist required for a signing MVP.
const SignPage = () => {
  const signMvpTasks = [
    {
      title: 'Signature placement UI',
      detail: 'Place a signature field on a PDF with drag/drop + resize; support multiple signers.',
    },
    {
      title: 'Identity & consent',
      detail: 'Signer authentication (email link / SSO) + explicit consent before signing.',
    },
    {
      title: 'Audit trail',
      detail: 'Record who signed, when, from where, and what version/hash of the document was signed.',
    },
    {
      title: 'Document integrity (hashing)',
      detail: 'Generate and store a stable doc hash; prevent signing if the PDF changes.',
    },
    {
      title: 'Signature appearance',
      detail: 'Render a professional signature mark (typed/drawn/uploaded) with timestamp.',
    },
    {
      title: 'Export signed PDF',
      detail: 'Produce a signed PDF + embedded audit data (or sidecar) with deterministic output.',
    },
    {
      title: 'Verification view',
      detail: 'A public verification page that checks integrity + shows audit details safely.',
    },
    {
      title: 'Send-for-signing flow',
      detail: 'Invite signer(s), track status (sent/viewed/signed), reminders, and expiry.',
    },
    {
      title: 'Storage & retention policy',
      detail: 'Define what is stored for Free vs Pro, retention, deletion, and user controls.',
    },
    {
      title: 'Legal/terms UX',
      detail: 'Terms, privacy, and “not legal advice” shown at decision points; versioned change notice.',
    },
  ];

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Sign PDFs</h1>
      <p style={{ marginTop: 8, color: '#334155', lineHeight: 1.6 }}>
        Signing is not ready yet. To ship a safe, verifiable signing MVP we need to complete{' '}
        <strong>{signMvpTasks.length} tasks</strong>.
      </p>

      <div style={{ marginTop: 24, padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: '#ffffff' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Signing MVP checklist</h2>
        <ol style={{ marginTop: 12, marginBottom: 0, paddingLeft: 18, color: '#0f172a' }}>
          {signMvpTasks.map((task) => (
            <li key={task.title} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>{task.title}</div>
              <div style={{ color: '#475569', marginTop: 4 }}>{task.detail}</div>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to="/view"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
        >
          Analyze a PDF
        </Link>
        <Link
          to="/contact"
          className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700"
        >
          Join the waitlist
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthErrorNotification />
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<HomePage />} />
            <Route
              path="/sign"
              element={
                <Layout>
                  <SignPage />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <AboutPage />
                </Layout>
              }
            />
            <Route
              path="/privacy"
              element={
                <Layout>
                  <PrivacyPage />
                </Layout>
              }
            />
            <Route
              path="/terms"
              element={
                <Layout>
                  <TermsPage />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <ContactPage />
                </Layout>
              }
            />
            <Route
              path="/pricing"
              element={
                <Layout>
                  <PricingPage />
                </Layout>
              }
            />
            <Route
              path="/sign-in"
              element={
                <Layout>
                  <SignInPage />
                </Layout>
              }
            />
            <Route
              path="/profile"
              element={
                <Layout>
                  <ProfilePage />
                </Layout>
              }
            />
            <Route
              path="/view/:documentId?"
              element={
                <Layout>
                  <DocumentViewer />
                </Layout>
              }
            />
            {/* Specific route for test documents */}
            <Route
              path="/view/test-docs/:fileName"
              element={
                <Layout>
                  <DocumentViewer />
                </Layout>
              }
            />
            <Route
              path="/edit/:documentId?"
              element={
                <Layout>
                  <DocumentEditor />
                </Layout>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;