import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

import logo from '../assets/DecoDocsLogo.svg';
import Footer from './landing/Footer.jsx';

/**
 * Shared app layout.
 *
 * NOTE: This intentionally matches the landing design language (logo + light header)
 * so pages don't feel like separate products.
 */
const Layout = ({ children, showHeader = true, showFooter = true, variant = 'marketing' }) => {
  const { authState } = useAuth();
  const location = useLocation();
  const firebaseError = authState.status === 'error' ? authState.error?.message : null;

  const isHome = location.pathname === '/' || location.pathname === '/app';
  const isAppLayout = variant === 'app';

  return (
    <div className={`legacy-app min-h-screen bg-[#f7f6f2] text-slate-900 flex flex-col ${isAppLayout ? 'h-screen overflow-hidden' : ''}`}>
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-30 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
          <div className={`mx-auto flex w-full items-center justify-between px-6 ${isAppLayout ? 'h-14 py-2' : 'max-w-6xl py-4'}`}>
            <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-slate-900 no-underline">
              <img src={logo} alt="DecoDocs" className="h-9 w-9" />
              {!isAppLayout && "DecoDocs"}
            </Link>

            {!isAppLayout && (
              <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                {isHome ? (
                  <>
                    <a className="hover:text-slate-900 transition" href="#how-it-works">How it works</a>
                    <a className="hover:text-slate-900 transition" href="#features">Features</a>
                    <a className="hover:text-slate-900 transition" href="#use-cases">Use cases</a>
                    <a className="hover:text-slate-900 transition" href="#pricing">Pricing</a>
                  </>
                ) : (
                  <>
                    <Link className="hover:text-slate-900 transition no-underline text-slate-600" to="/view">App</Link>
                    <Link className="hover:text-slate-900 transition no-underline text-slate-600" to="/pricing">Pricing</Link>
                    <Link className="hover:text-slate-900 transition no-underline text-slate-600" to="/sign-in">Sign in</Link>
                    <Link className="hover:text-slate-900 transition no-underline text-slate-600" to="/profile">Profile</Link>
                  </>
                )}
              </nav>
            )}

            <div className="flex items-center gap-3">
              {!isAppLayout && (
                <>
                  <Link
                    to="/view"
                    className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 md:inline-flex no-underline"
                  >
                    Launch app
                  </Link>
                  <Link
                    to="/pricing"
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 no-underline"
                  >
                    Pricing
                  </Link>
                </>
              )}
              {isAppLayout && (
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900 no-underline">Profile</Link>
                </div>
              )}
            </div>
          </div>

          {/* Auth Status Banner (compact) */}
          <div className="border-t border-white/40 bg-white/60 px-6 py-2 text-xs text-slate-600">
            <div className={`mx-auto w-full ${isAppLayout ? '' : 'max-w-6xl'}`}>
              {authState.status === 'authenticated' ? (
                <span>Authenticated (AI features available)</span>
              ) : firebaseError ? (
                <span>AI calls disabled: "{firebaseError}" (viewer still works)</span>
              ) : (
                <span>Authenticating…</span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>

      {/* Footer */}
      {showFooter ? <Footer /> : null}
    </div>
  );
};

export default Layout;
