import React from 'react';

import Footer from './landing/Footer.jsx';
import GoogleOneTap from './auth/GoogleOneTap.jsx';
import SiteHeader from './SiteHeader.jsx';
import ReportWidget from './ReportWidget.jsx';
import { useLocation } from 'react-router-dom';

/**
 * Shared app layout.
 *
 * NOTE: This intentionally matches the landing design language (logo + light header)
 * so pages don't feel like separate products.
 */
const Layout = ({
  children,
  showHeader = true,
  showFooter = true,
  showOneTap = false,
  showDecor = false,
  variant = 'marketing',
  onOpenPdf,
}) => {
  const isAppLayout = variant === 'app';

  // when the app is rendering the document workspace (/view or /edit)
  // we want the header to behave like a normal page header – static and
  // allow the browser window to scroll rather than locking the viewport
  // height. otherwise, `h-screen overflow-hidden` keeps the header pinned
  // while inner containers scroll.
  const location = useLocation();
  const isWorkspaceRoute =
    location?.pathname?.startsWith('/view') ||
    location?.pathname?.startsWith('/edit');

  return (
    <div
      className={`min-h-screen bg-[#f7f6f2] text-slate-900 flex flex-col ${
        isAppLayout && !isWorkspaceRoute ? 'h-screen overflow-hidden' : ''
      }`}
    >
      {showOneTap ? <GoogleOneTap /> : null}
      <div className={`relative flex min-h-0 flex-1 flex-col ${showDecor ? 'overflow-hidden' : ''}`}>
        {showDecor ? (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-[#d8e6ff] blur-3xl opacity-60 animate-float-slow" />
            <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-[#fde4c7] blur-3xl opacity-50 animate-float-slow" />
          </div>
        ) : null}

        {/* Header */}
        {showHeader ? <SiteHeader variant={variant} onOpenPdf={onOpenPdf} /> : null}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col min-h-0 ${showDecor ? 'relative z-10' : ''}`}>
          {children}
        </main>

        {/* Footer */}
        {showFooter ? <Footer /> : null}
      </div>
      <ReportWidget />
    </div>
  );
};

export default Layout;
