import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import SignPage from './components/SignPage.jsx';
import UseCasePage from './components/landing/UseCasePage.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';
import ServerErrorPage from './components/ServerErrorPage.jsx';
import PublicLayout from './components/layouts/PublicLayout.jsx';
import AuthLayout from './components/layouts/AuthLayout.jsx';
import WebAppLayout from './components/layouts/WebAppLayout.jsx';
import WorkspaceLayout from './components/layouts/WorkspaceLayout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import AuthErrorNotification from './components/AuthErrorNotification.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import './App.css';

// Simple PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { authState } = useAuth();
  if (authState.status === 'pending') return <div>Loading...</div>;
  if (authState.status !== 'authenticated') return <Navigate to="/sign-in" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<HomePage />} />

      {/* Pricing Page */}
      <Route path="/pricing" element={
        <PublicLayout>
          <PricingPage />
        </PublicLayout>
      } />

      {/* About Page */}
      <Route path="/about" element={
        <PublicLayout>
          <AboutPage />
        </PublicLayout>
      } />

      {/* Privacy Page */}
      <Route path="/privacy" element={
        <PublicLayout>
          <PrivacyPage />
        </PublicLayout>
      } />

      {/* Terms Page */}
      <Route path="/terms" element={
        <PublicLayout>
          <TermsPage />
        </PublicLayout>
      } />

      {/* Contact Page */}
      <Route path="/contact" element={
        <PublicLayout>
          <ContactPage />
        </PublicLayout>
      } />

      {/* Use cases (landing detail pages) */}
      <Route path="/use-cases/:slug" element={<UseCasePage />} />

      {/* Auth Pages */}
      <Route path="/sign-in" element={
        <AuthLayout>
          <SignInPage />
        </AuthLayout>
      } />

      <Route path="/sign-up" element={
        <AuthLayout>
          <SignUpPage />
        </AuthLayout>
      } />

      {/* App / Document Viewer */}
      <Route path="/view" element={
        <WorkspaceLayout>
          <DocumentViewer />
        </WorkspaceLayout>
      } />

      <Route path="/view/:documentId" element={
        <WorkspaceLayout>
          <DocumentViewer />
        </WorkspaceLayout>
      } />

      {/* Specific route for test documents */}
      <Route path="/view/test-docs/:fileName" element={
        <WorkspaceLayout>
          <DocumentViewer />
        </WorkspaceLayout>
      } />

      {/* Profile */}
      <Route path="/profile" element={
        <PrivateRoute>
          <WebAppLayout>
            <ProfilePage />
          </WebAppLayout>
        </PrivateRoute>
      } />

      {/* Editor */}
      <Route path="/edit/:documentId" element={
        <PrivateRoute>
          <WorkspaceLayout>
            <DocumentEditor />
          </WorkspaceLayout>
        </PrivateRoute>
      } />

      <Route path="/edit/test-docs/:fileName" element={
        <PrivateRoute>
          <WorkspaceLayout>
            <DocumentEditor />
          </WorkspaceLayout>
        </PrivateRoute>
      } />

      {/* Sign Page */}
      <Route path="/sign" element={
        <PublicLayout>
          <SignPage />
        </PublicLayout>
      } />

      {/* Error Pages */}
      <Route path="/500" element={
        <PublicLayout>
          <ServerErrorPage />
        </PublicLayout>
      } />

      {/* Legacy App Route */}
      <Route path="/app" element={<Navigate to="/view" replace />} />

      {/* Catch-all */}
      <Route path="*" element={
        <PublicLayout>
          <NotFoundPage />
        </PublicLayout>
      } />
    </Routes>
  );
};

const App = ({ basename = '/' }) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthErrorNotification />
        <Router basename={basename}>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
