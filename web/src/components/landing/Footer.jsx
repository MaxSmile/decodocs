import React from 'react';

import { footerLinks } from '../../lib/landingData.js';
import logo from '../../assets/DecoDocsLogo.svg';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="DecoDocs" className="h-10 w-10" />
            <div>
              <p className="text-base font-semibold text-slate-900">DecoDocs</p>
              <p className="text-xs text-slate-500">Understand documents before you sign</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Privacy-first document understanding by Snap Sign Pty Ltd.
          </p>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Snap Sign Pty Ltd. All rights reserved.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Product</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {footerLinks.product.map((link) => (
              <li key={link.label}>
                <a className="hover:text-slate-900" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Company</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {footerLinks.company.map((link) => (
              <li key={link.label}>
                <a className="hover:text-slate-900" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">Legal</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {footerLinks.legal.map((link) => (
              <li key={link.label}>
                <a className="hover:text-slate-900" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
