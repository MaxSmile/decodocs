import React from 'react';
import { Link } from 'react-router-dom';
import Card from './ui/Card.jsx';
import PageSection from './ui/PageSection.jsx';

export default function NotFoundPage() {
  return (
    <PageSection size="md">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Error 404</p>
        <h1 className="dd-title mt-3">Page not found</h1>
        <p className="dd-lead">
          The page you requested does not exist or has been moved. Use one of the links below to continue.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link to="/" className="dd-btn dd-btn-solid no-underline">Go to home</Link>
          <Link to="/view" className="dd-btn dd-btn-outline no-underline">Open viewer</Link>
        </div>
      </Card>
    </PageSection>
  );
}
