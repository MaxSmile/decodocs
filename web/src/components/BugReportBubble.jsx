import React, { useMemo, useState } from 'react';
import { getFunctions } from 'firebase/functions';

import { useAuth } from '../context/AuthContext.jsx';
import { submitClientCrash } from '../services/reportService.js';

const buttonClass =
  'fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-800';

const BugReportBubble = () => {
  const { app } = useAuth();
  const functions = useMemo(() => (app ? getFunctions(app) : null), [app]);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const close = () => {
    setOpen(false);
    setMessage('');
    setBusy(false);
    setError('');
    setDone('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setDone('');

    const trimmed = message.trim();
    if (trimmed.length < 8) {
      setError('Please describe the issue in at least 8 characters.');
      return;
    }
    if (!functions) {
      setError('Reporting is temporarily unavailable. Refresh and try again.');
      return;
    }

    try {
      setBusy(true);
      await submitClientCrash(functions, {
        source: 'web',
        eventType: 'user_bug_report',
        message: trimmed,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        extra: {
          route: window.location.pathname,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          title: document.title || null,
        },
      });
      setDone('Bug report submitted. Thank you.');
      setMessage('');
    } catch (e) {
      setError(e?.message || 'Failed to submit bug report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        Report bug
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/25 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">Report a bug</h3>
            <p className="mt-1 text-sm text-slate-600">Your report is saved to the crash intake queue.</p>

            <form onSubmit={onSubmit} className="mt-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                placeholder="What happened? What did you expect instead?"
              />

              {error ? <div className="mt-2 text-sm text-rose-700">{error}</div> : null}
              {done ? <div className="mt-2 text-sm text-emerald-700">{done}</div> : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default BugReportBubble;
