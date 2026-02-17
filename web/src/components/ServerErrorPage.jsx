import React from 'react';
import Card from './ui/Card.jsx';
import Notice from './ui/Notice.jsx';
import PageSection from './ui/PageSection.jsx';

const isDev = Boolean(import.meta?.env?.DEV);

export default function ServerErrorPage({ error = null, errorInfo = null }) {
  return (
    <PageSection size="md">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Error 500</p>
        <h1 className="dd-title mt-3">Something went wrong</h1>
        <p className="dd-lead">
          We hit an unexpected application error. Try refreshing the page or return to the homepage.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <a href="/" className="dd-btn dd-btn-solid no-underline">Go to home</a>
          <a href="/view" className="dd-btn dd-btn-outline no-underline">Open viewer</a>
        </div>

        {isDev ? (
          <Notice tone="error" className="mt-5">
            <details>
              <summary className="cursor-pointer font-semibold">Technical details (development only)</summary>
              <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6">
                {error ? String(error) : 'No error payload available.'}
              </div>
              {errorInfo?.componentStack ? (
                <pre className="mt-2 overflow-auto rounded-md bg-white/70 p-2 text-[11px] leading-5 text-slate-800">
                  {errorInfo.componentStack}
                </pre>
              ) : null}
            </details>
          </Notice>
        ) : null}
      </Card>
    </PageSection>
  );
}
