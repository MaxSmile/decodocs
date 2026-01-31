import React from 'react';

import LandingLayout from './landing/Layout.jsx';

const PrivacyPage = () => {
  return (
    <LandingLayout onOpenPdf={() => {}}>
      <section className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-600">Last updated: 1 February 2026</p>

        <div className="mt-10 space-y-6 text-slate-700 leading-relaxed">
          <p>
            DecoDocs ("we", "us") is built by Snap Sign Pty Ltd. This policy explains what data is processed when you use
            DecoDocs, what is stored, and what choices you have.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">What we process</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>PDF file metadata (filename, size) and content needed to render and analyze the document.</li>
            <li>Extracted text used to generate summaries, explanations, and risk highlights.</li>
            <li>Basic usage events (e.g. button clicks) to understand product performance.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900">Storage (Free vs Pro)</h2>
          <p>
            <strong>Free:</strong> we aim to avoid storing your files. Documents are opened for viewing and analysis without
            persistent storage.
          </p>
          <p>
            <strong>Pro (optional):</strong> secure storage may be available for users who explicitly choose to save documents
            for later access.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Retention</h2>
          <p>
            We retain only what is necessary to operate the service. Where storage is enabled (e.g. Pro), retention and
            deletion controls will be provided.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Your controls</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You can choose whether to use free (no-storage) workflows or paid storage features when available.</li>
            <li>You can contact us to request deletion or export of stored data where applicable.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Questions or requests: <a className="underline" href="mailto:team@snapsign.com.au">team@snapsign.com.au</a>
          </p>
        </div>
      </section>
    </LandingLayout>
  );
};

export default PrivacyPage;
