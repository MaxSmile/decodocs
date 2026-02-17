import React, { useEffect, useRef } from 'react';
import { GoogleAuthProvider, linkWithCredential, signInWithCredential } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext.jsx';
import { trackAuthEvent } from '../../lib/authTelemetry.js';

const DISMISS_KEY = 'decodocs_gis_one_tap_dismissed_until';
const SHOWN_KEY = 'decodocs_gis_one_tap_shown';

const nowMs = () => Date.now();

const getDismissedUntilMs = () => {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
};

const setDismissedForDays = (days) => {
  try {
    localStorage.setItem(DISMISS_KEY, String(nowMs() + days * 24 * 60 * 60 * 1000));
  } catch {
    // ignore
  }
};

const getShownThisSession = () => {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === '1';
  } catch {
    return false;
  }
};

const setShownThisSession = () => {
  try {
    sessionStorage.setItem(SHOWN_KEY, '1');
  } catch {
    // ignore
  }
};

const loadScriptOnce = (src) =>
  new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve();

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });

/**
 * Google Identity Services (One Tap)
 *
 * Only activates when:
 * - VITE_GOOGLE_GIS_CLIENT_ID is provided
 * - user is anonymous (or unauthenticated)
 * - not dismissed recently
 */
export default function GoogleOneTap() {
  const { authState, auth } = useAuth();
  const startedRef = useRef(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_GIS_CLIENT_ID;
    if (!clientId) return;

    // Only show when NOT fully signed in.
    const user = authState?.user;
    const shouldShow = authState?.status === 'authenticated' && user?.isAnonymous;
    if (!shouldShow) return;

    if (startedRef.current) return;
    startedRef.current = true;

    // Respect recent dismissals.
    if (getDismissedUntilMs() > nowMs()) return;

    // Show at most once per session unless user explicitly interacts.
    if (getShownThisSession()) return;

    const run = async () => {
      try {
        await loadScriptOnce('https://accounts.google.com/gsi/client');

        if (!window.google?.accounts?.id) return;

        trackAuthEvent('auth_one_tap_shown');

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              if (!response?.credential) throw new Error('Missing credential');
              if (!auth) throw new Error('Auth is not available');

              const credential = GoogleAuthProvider.credential(response.credential);

              // Anonymous-first: prefer linking if we have an active user.
              if (auth.currentUser) {
                await linkWithCredential(auth.currentUser, credential);
              } else {
                await signInWithCredential(auth, credential);
              }

              trackAuthEvent('auth_one_tap_success');
            } catch (e) {
              // If user closes the One Tap prompt, Google sends a moment notification instead.
              trackAuthEvent('auth_one_tap_error');
              // eslint-disable-next-line no-console
              console.error('One Tap sign-in failed:', e);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.prompt((notification) => {
          // Mark session as shown once prompt ran.
          setShownThisSession();

          if (notification?.isDismissedMoment?.()) {
            // Respect dismissal for 7 days.
            setDismissedForDays(7);
            trackAuthEvent('auth_one_tap_dismissed');
          }
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load Google One Tap:', e);
      }
    };

    run();
  }, [authState?.status, authState?.user?.isAnonymous, auth]);

  return null;
}
