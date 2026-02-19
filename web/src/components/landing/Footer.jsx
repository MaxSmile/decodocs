import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { footerLinks } from '../../lib/landingData.js';
import logo from '../../assets/DecoDocsLogo.svg';
import { APP_VERSION } from '../../lib/version.js';

const FooterLink = ({ href, children }) => {
  const isExternal = typeof href === 'string' && /^https?:\/\//.test(href);
  const isHash = typeof href === 'string' && href.startsWith('#');
  const isAstroPage = href === '/privacy' || href === '/terms';

  if (isExternal || isAstroPage) {
    return (
      <a className="text-slate-600 no-underline hover:text-slate-900 hover:underline" href={href}>
        {children}
      </a>
    );
  }

  if (isHash) {
    // Hash sections live on the landing page. Ensure we always navigate to '/#...'
    return (
      <Link className="text-slate-600 no-underline hover:text-slate-900 hover:underline" to={{ pathname: '/', hash: href }}>
        {children}
      </Link>
    );
  }

  return (
    <Link className="text-slate-600 no-underline hover:text-slate-900 hover:underline" to={href}>
      {children}
    </Link>
  );
};

const Footer = () => {
  const logoSrc = typeof logo === 'string' ? logo : logo.src;
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="DecoDocs" className="h-10 w-10" />
            <div>
              <p className="text-base font-semibold text-slate-900">DecoDocs</p>
              <p className="text-xs text-slate-500">Understand documents before you sign</p>
            </div>
          </div>
          <div className="mt-2">
            <Link to="/view" className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-slate-800" aria-label="Open DecoDocs Web App">Open DecoDocs Web App</Link>
          </div>
          <p className="text-sm text-slate-600">
            Privacy-first document understanding by Snap Sign Pty Ltd.
          </p>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Snap Sign Pty Ltd. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Version: {APP_VERSION}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Product</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 list-none p-0 m-0">
            {footerLinks.product.map((link) => (
              <li key={link.label} className="m-0">
                {isHome && typeof link.href === 'string' && link.href.startsWith('#') ? (
                  <a className="text-slate-600 no-underline hover:text-slate-900 hover:underline" href={link.href}>
                    {link.label}
                  </a>
                ) : (
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Company</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 list-none p-0 m-0">
            {footerLinks.company.map((link) => (
              <li key={link.label} className="m-0">
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Docs</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 list-none p-0 m-0">
            {footerLinks.docs.map((link) => (
              <li key={link.label} className="m-0">
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Legal</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 list-none p-0 m-0">
            {footerLinks.legal.map((link) => (
              <li key={link.label} className="m-0">
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
