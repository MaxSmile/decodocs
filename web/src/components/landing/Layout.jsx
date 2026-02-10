import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

import logo from '../../assets/DecoDocsLogo.svg';
import Footer from './Footer.jsx';
import GoogleOneTap from '../auth/GoogleOneTap.jsx';

const Layout = ({ onOpenPdf, children }) => {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-900 font-sans">
      {/* One Tap only runs when configured + user is anonymous */}
      <GoogleOneTap />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-[#d8e6ff] blur-3xl opacity-60 animate-float-slow" />
          <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-[#fde4c7] blur-3xl opacity-50 animate-float-slow" />
        </div>

        <header className="sticky top-0 z-30 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3 text-lg font-bold tracking-tight">
              <img src={logo} alt="DecoDocs" className="h-9 w-9" />
              DecoDocs
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
              <a className="hover:text-slate-900 transition-colors" href="#how-it-works">How it works</a>
              <a className="hover:text-slate-900 transition-colors" href="#features">Features</a>
              <a className="hover:text-slate-900 transition-colors" href="#use-cases">Use cases</a>
            </nav>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                to="/view"
                className="hidden md:inline-flex bg-white/50"
              >
                Launch app
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenPdf}
              >
                Open PDF
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
