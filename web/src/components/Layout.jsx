import React from 'react';

import Footer from './landing/Footer.jsx';
import SiteHeader from './SiteHeader.jsx';

/**
 * Shared app layout.
 *
 * NOTE: This intentionally matches the landing design language (logo + light header)
 * so pages don't feel like separate products.
 */
const Layout = ({ children, showHeader = false, showFooter = true, variant = 'marketing' }) => {
  const isAppLayout = variant === 'app';

  return (
    <div className={`min-h-screen bg-[#f7f6f2] text-slate-900 flex flex-col ${isAppLayout ? 'h-screen overflow-hidden' : ''}`}>
      {/* Header */}
      {showHeader && (
        <SiteHeader variant={variant} />
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
