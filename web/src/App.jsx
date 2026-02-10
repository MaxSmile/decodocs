import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage.jsx';
import DocumentViewer from './components/DocumentViewer.jsx';
import DocumentEditor from './components/DocumentEditor.jsx';
import AboutPage from './components/AboutPage.jsx';
import PrivacyPage from './components/PrivacyPage.jsx';
import TermsPage from './components/TermsPage.jsx';
import ContactPage from './components/ContactPage.jsx';
import PricingPage from './components/PricingPage.jsx';
import SignInPage from './components/SignInPage.jsx';
import SignUpPage from './components/SignUpPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import UseCasePage from './components/landing/UseCasePage.jsx';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthErrorNotification from './components/AuthErrorNotification.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import './App.css';

// Simple PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { authState } = useAuth();
  if (authState.status === 'loading') return <div>Loading...</div>;
  if (authState.status !== 'authenticated') return <Navigate to="/sign-in" replace />;
  return children;
};

// "Sign" roadmap page
const SignPage = () => {
  const signMvpTasks = [
    { title: 'Signature placement UI', detail: 'Place a signature field on a PDF with drag/drop + resize.' },
    { title: 'Identity & consent', detail: 'Signer authentication + explicit consent.' },
    { title: 'Audit trail', detail: 'Record who signed, when, and what hash.' },
  ];

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Sign PDFs</h1>
      <p>Signing is not ready yet. This is a roadmap placeholder.</p>
      <ul>
        {signMvpTasks.map(t => <li key={t.title}><strong>{t.title}</strong>: {t.detail}</li>)}
      </ul>
    </div>
  );
};

// Placeholder for SignUp if not imported
// const SignUp = () => <div>Sign Up Page</div>;

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthErrorNotification />
        <Router>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<HomePage />} />

            {/* Pricing Page */}
            <Route path="/pricing" element={
              <Layout>
                <PricingPage />
              </Layout>
            } />

            {/* About Page */}
            <Route path="/about" element={
              <Layout>
                <AboutPage />
              </Layout>
            } />

            {/* Privacy Page */}
            <Route path="/privacy" element={
              <Layout>
                <PrivacyPage />
              </Layout>
            } />

            {/* Terms Page */}
            <Route path="/terms" element={
              <Layout>
                <TermsPage />
              </Layout>
            } />

            {/* Contact Page */}
            <Route path="/contact" element={
              <Layout>
                <ContactPage />
              </Layout>
            } />

            {/* Use Case Pages */}
            <Route path="/use-cases/:slug" element={<UseCasePage />} />

            {/* Auth Pages */}
            <Route path="/sign-in" element={
              <Layout>
                <SignInPage />
              </Layout>
            } />

            <Route path="/sign-up" element={
              <Layout>
                <SignUpPage />
              </Layout>
            } />

            {/* App / Document Viewer */}
            <Route path="/view" element={
              <DocumentViewer />
            } />

            <Route path="/view/:documentId" element={
              <DocumentViewer />
            } />

            {/* Specific route for test documents */}
            <Route path="/view/test-docs/:fileName" element={
              <DocumentViewer />
            } />

            {/* Profile */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Layout variant="app">
                  <ProfilePage />
                </Layout>
              </PrivateRoute>
            } />

            {/* Editor */}
            <Route path="/edit/:documentId" element={
              <PrivateRoute>
                <DocumentEditor />
              </PrivateRoute>
            } />

            <Route path="/edit/test-docs/:fileName" element={
              <PrivateRoute>
                <DocumentEditor />
              </PrivateRoute>
            } />

            {/* Sign Page */}
            <Route path="/sign" element={
              <Layout>
                <SignPage />
              </Layout>
            } />

            {/* Legacy App Route */}
            <Route path="/app" element={<Navigate to="/view" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;