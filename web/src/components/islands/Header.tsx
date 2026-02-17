import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { HiSparkles, HiUser } from 'react-icons/hi';
import logo from '../../assets/DecoDocsLogo.svg';
import { authStateStore } from '../../stores/authStore.ts';

type HeaderProps = {
  showMarketingNav?: boolean;
};

const marketingNav = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'Use cases', href: '/#use-cases' },
  { label: 'Pricing', href: '/pricing' },
];

const appPathPrefixes = ['/view', '/edit', '/profile', '/app'];

const Header = ({ showMarketingNav = true }: HeaderProps) => {
  const logoSrc = typeof logo === 'string' ? logo : logo.src;
  const authState = useStore(authStateStore);
  const [pathname, setPathname] = useState('/');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const syncPath = () => {
    setPathname(window.location.pathname);
    setIsMobileOpen(false);
  };

  useEffect(() => {
    syncPath();
    window.addEventListener('popstate', syncPath);
    document.addEventListener('astro:page-load', syncPath);
    document.addEventListener('astro:after-swap', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      document.removeEventListener('astro:page-load', syncPath);
      document.removeEventListener('astro:after-swap', syncPath);
    };
  }, []);

  const isAppLayout = useMemo(
    () => appPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
  const isAuthenticated = authState?.status === 'authenticated';

  const primaryAction = (() => {
    if (isAuthPage) {
      return pathname === '/sign-in'
        ? { label: 'Sign Up', href: '/sign-up' }
        : { label: 'Sign In', href: '/sign-in' };
    }

    return isAuthenticated
      ? { label: 'Profile', href: '/profile' }
      : { label: 'Sign In', href: '/sign-in' };
  })();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className={`mx-auto flex w-full items-center justify-between px-6 ${isAppLayout ? 'h-14 py-2' : 'max-w-6xl py-4'}`}>
        <a href="/" className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900 no-underline">
          <img src={logoSrc} alt="DecoDocs" className="h-9 w-9" />
          {!isAppLayout && 'DecoDocs'}
        </a>

        {!isAppLayout && showMarketingNav && (
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            {marketingNav.map((item) => (
              <a key={item.label} className="hover:text-slate-900 transition-colors no-underline text-slate-600" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAppLayout ? (
            <div id="header-app-actions" className="flex items-center gap-2">
              <a
                href="/pricing"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors no-underline border border-amber-200/60"
              >
                <HiSparkles className="w-3.5 h-3.5" />
                Upgrade
              </a>
              <a
                href="/profile"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/60"
                title={authState?.user?.email || 'Profile'}
              >
                {authState?.user?.photoURL ? (
                  <img src={authState.user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <HiUser className="w-4 h-4 text-slate-500" />
                )}
              </a>
            </div>
          ) : (
            <>
              <a
                href={primaryAction.href}
                className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-slate-800 md:inline-flex"
              >
                {primaryAction.label}
              </a>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-2 text-slate-700 shadow-sm transition hover:border-slate-300 md:hidden"
                aria-expanded={isMobileOpen}
                aria-controls="site-mobile-menu"
                onClick={() => setIsMobileOpen((value) => !value)}
              >
                <span className="sr-only">Toggle menu</span>
                {isMobileOpen ? '×' : '☰'}
              </button>
            </>
          )}
        </div>
      </div>

      {!isAppLayout && showMarketingNav && isMobileOpen && (
        <div id="site-mobile-menu" className="md:hidden">
          <div className="px-6 pb-4 pt-2">
            <div className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
              {marketingNav.map((item) => (
                <a key={item.label} href={item.href} className="no-underline text-slate-700">
                  {item.label}
                </a>
              ))}
            </div>
            <a
              href={primaryAction.href}
              className="mt-4 inline-flex w-full justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white no-underline"
            >
              {primaryAction.label}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
