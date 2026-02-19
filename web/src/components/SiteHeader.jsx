import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiUser, HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './ui/Button.jsx';
import logo from '../assets/DecoDocsLogo.svg';

const coreNav = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Use cases', to: '/uses-cases' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
];

const SiteHeader = ({ variant = 'marketing', onOpenPdf, children }) => {
  const logoSrc = typeof logo === 'string' ? logo : logo.src;
  const location = useLocation();
  const { authState } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAppLayout = variant === 'app';
  const isHome = location.pathname === '/' || location.pathname === '/app';
  const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';
  const isAuthenticated = authState?.status === 'authenticated' && !authState?.user?.isAnonymous;
  const desktopNavClass = isAppLayout
    ? 'hidden items-center gap-5 text-sm font-semibold text-slate-600 lg:flex'
    : 'hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex';

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, location.hash]);

  const primaryAction = (() => {
    if (isAuthPage) {
      return location.pathname === '/sign-in'
        ? { label: 'Sign Up', to: '/sign-up' }
        : { label: 'Sign In', to: '/sign-in' };
    }

    if (onOpenPdf) {
      return { label: 'Open PDF', onClick: onOpenPdf };
    }

    return isAuthenticated
      ? { label: 'Profile', to: '/profile' }
      : { label: 'Sign In', to: '/sign-in' };
  })();

  const secondaryAction = (() => {
    if (isAuthPage) return null;
    if (onOpenPdf) {
      return isAuthenticated
        ? { label: 'Profile', to: '/profile', variant: 'outline' }
        : { label: 'Sign In', to: '/sign-in', variant: 'outline' };
    }
    return null;
  })();

  const handleToggle = () => setIsMobileOpen((open) => !open);
  const closeMenu = () => setIsMobileOpen(false);

  const renderNavItem = (item) => {
    const className = 'hover:text-slate-900 transition-colors no-underline text-slate-600';

    if (item.href && item.href.startsWith('#')) {
      if (isHome) {
        return (
          <a className={className} href={item.href} onClick={closeMenu}>
            {item.label}
          </a>
        );
      }

      return (
        <Link className={className} to={{ pathname: '/', hash: item.href }} onClick={closeMenu}>
          {item.label}
        </Link>
      );
    }

    return (
      <Link className={className} to={item.to} onClick={closeMenu}>
        {item.label}
      </Link>
    );
  };

  const renderAction = (action, extraClasses = '') => {
    if (!action) return null;

    const { label, to, onClick, variant = 'primary' } = action;
    const handleClick = onClick
      ? () => {
        closeMenu();
        onClick();
      }
      : undefined;

    return (
      <Button
        variant={variant}
        size="sm"
        to={to}
        onClick={handleClick}
        className={extraClasses}
      >
        {label}
      </Button>
    );
  };

  return (
    <header className="sticky top-[var(--support-ukraine-banner-height,35px)] z-30 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className={`mx-auto flex w-full items-center justify-between px-5 sm:px-6 ${isAppLayout ? 'h-14 py-2' : 'max-w-6xl py-3 sm:py-4'}`}>
        <Link to="/" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 no-underline sm:gap-3 sm:text-lg">
          <img src={logoSrc} alt="DecoDocs" className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="hidden sm:inline">DecoDocs</span>
        </Link>

        <nav className={desktopNavClass}>
          {coreNav.map((item) => (
            <span key={item.label}>{renderNavItem(item)}</span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isAppLayout && (
            <div className="hidden items-center gap-3 md:flex">
              {renderAction(secondaryAction, 'bg-white/50')}
              {renderAction(primaryAction)}
            </div>
          )}

          {isAppLayout && (
            <div id="header-app-actions" className="flex items-center gap-2">
              <Link
                to="/pricing"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors no-underline border border-amber-200/60"
              >
                <HiSparkles className="w-3.5 h-3.5" />
                Upgrade
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/60"
                  title={authState?.user?.email || 'Profile'}
                >
                  {authState?.user?.photoURL ? (
                    <img src={authState.user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <HiUser className="w-4 h-4 text-slate-500" />
                  )}
                </Link>
              ) : (
                <Link
                  to="/sign-in"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 no-underline hover:bg-slate-50"
                >
                  Sign In
                </Link>
              )}
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-2 text-slate-700 shadow-sm transition hover:border-slate-300 lg:hidden"
            aria-expanded={isMobileOpen}
            aria-controls="site-mobile-menu"
            onClick={handleToggle}
          >
            <span className="sr-only">Toggle menu</span>
            {isMobileOpen ? (
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div id="site-mobile-menu" className={`lg:hidden ${isMobileOpen ? 'block' : 'hidden'}`}>
        <div className="px-6 pb-4 pt-2">
          <div className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
            {coreNav.map((item) => (
              <span key={item.label}>{renderNavItem(item)}</span>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {isAppLayout ? (
              <>
                <Link
                  to="/pricing"
                  onClick={closeMenu}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 no-underline hover:bg-amber-100"
                >
                  <HiSparkles className="h-4 w-4" />
                  Upgrade
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline hover:bg-slate-50"
                  >
                    Profile
                  </Link>
                ) : (
                  <Link
                    to="/sign-in"
                    onClick={closeMenu}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                )}
              </>
            ) : (
              <>
                {renderAction(secondaryAction, 'w-full justify-center bg-white/60')}
                {renderAction(primaryAction, 'w-full justify-center')}
              </>
            )}
          </div>
        </div>
      </div>

      {children}
    </header>
  );
};

export default SiteHeader;
