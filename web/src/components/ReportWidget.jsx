import React, { useMemo, useState } from 'react';
import { getFunctions } from 'firebase/functions';

import { useAuth } from '../context/AuthContext.jsx';
import { submitUserReport } from '../services/reportService.js';

const kinds = [
  { id: 'feedback', label: 'Leave feedback' },
  { id: 'bug', label: 'Report a bug' },
];

const baseButtonClasses = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:translate-y-[-1px]';

export default function ReportWidget() {
  const { app } = useAuth();
  const functions = useMemo(() => (app ? getFunctions(app) : null), [app]);

  const [openKind, setOpenKind] = useState(null);
  const [message, setMessage] = useState('');
  const [ratingStars, setRatingStars] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const openDialog = (kind) => {
    setOpenKind(kind);
    setMessage('');
    setRatingStars(0);
    setBusy(false);
    setError('');
    setDone('');
  };

  const closeDialog = () => {
    setOpenKind(null);
    setMessage('');
    setRatingStars(0);
    setBusy(false);
    setError('');
    setDone('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setDone('');

    if (!functions) {
      setError('Reporting is temporarily unavailable. Please refresh and try again.');
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 8) {
      setError('Please provide at least 8 characters.');
      return;
    }
    if (openKind === 'feedback' && (ratingStars < 1 || ratingStars > 5)) {
      setError('Please rate your experience from 1 to 5 stars.');
      return;
    }

    try {
      setBusy(true);
      await submitUserReport(functions, {
        kind: openKind,
        ratingStars: openKind === 'feedback' ? ratingStars : undefined,
        message: trimmed,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        extra: {
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
      });
      setDone('Submitted. Thank you.');
      setMessage('');
    } catch (e) {
      setError(e?.message || 'Failed to submit report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {kinds.map((kind) => (
          <button
            key={kind.id}
            type="button"
            onClick={() => openDialog(kind.id)}
            className={`${baseButtonClasses} ${kind.id === 'feedback' ? 'bg-white text-slate-900 border border-slate-300' : 'bg-slate-900 text-white border border-slate-900'}`}
          >
            {kind.label}
          </button>
        ))}
      </div>

      {openKind ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {openKind === 'feedback' ? 'Leave feedback' : 'Report a bug'}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              This goes to the admin reports dashboard.
            </p>

            <form onSubmit={onSubmit} className="mt-4">
              {openKind === 'feedback' ? (
                <div className="mb-3">
                  <p className="mb-2 text-sm font-medium text-slate-800">Rate your experience</p>
                  <div className="flex items-center gap-2" role="radiogroup" aria-label="Rate your experience from 1 to 5 stars">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = ratingStars === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setRatingStars(value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {value} star{value === 1 ? '' : 's'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                placeholder={openKind === 'feedback' ? 'Tell us what would make DecoDocs better...' : 'What happened? Include expected vs actual behavior.'}
              />

              {error ? <div className="mt-2 text-sm text-rose-700">{error}</div> : null}
              {done ? <div className="mt-2 text-sm text-emerald-700">{done}</div> : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
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
}
