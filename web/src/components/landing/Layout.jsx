import React from 'react';

import Footer from './Footer.jsx';
import GoogleOneTap from '../auth/GoogleOneTap.jsx';
import SiteHeader from '../SiteHeader.jsx';

const Layout = ({ onOpenPdf = () => {}, children }) => {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-900 font-sans">
      {/* One Tap only runs when configured + user is anonymous */}
      <GoogleOneTap />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-[#d8e6ff] blur-3xl opacity-60 animate-float-slow" />
          <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-[#fde4c7] blur-3xl opacity-50 animate-float-slow" />
        </div>

        <SiteHeader onOpenPdf={onOpenPdf} />

        <main className="relative z-10">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
