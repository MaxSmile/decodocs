import React from 'react';
import { Link } from 'react-router-dom';

import logo from '../../assets/DecoDocsLogo.svg';
import Footer from './Footer.jsx';

const Layout = ({ onOpenPdf, children }) => {
  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-[#d8e6ff] blur-3xl opacity-60 animate-float-slow" />
          <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-[#fde4c7] blur-3xl opacity-50 animate-float-slow" />
        </div>

        <header className="sticky top-0 z-30 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
              <img src={logo} alt="DecoDocs" className="h-9 w-9" />
              DecoDocs
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a className="hover:text-slate-900 transition" href="#how-it-works">How it works</a>
              <a className="hover:text-slate-900 transition" href="#features">Features</a>
              <a className="hover:text-slate-900 transition" href="#use-cases">Use cases</a>
              <a className="hover:text-slate-900 transition" href="#pricing">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                to="/view"
                className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 md:inline-flex"
              >
                Launch app
              </Link>
              <button
                type="button"
                onClick={onOpenPdf}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
              >
                Open PDF
              </button>
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
