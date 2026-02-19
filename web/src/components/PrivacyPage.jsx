import React from 'react';

const PrivacyPage = () => {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-600">Last updated: 17 February 2026</p>

      <div className="mt-10 space-y-6 text-slate-700 leading-relaxed">
        <p>
          DecoDocs ("we", "us") is built by Snap Sign Pty Ltd. This policy explains what we process, what we store,
          how account sign-in works, and what happens when you connect external providers or integrations.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">What we process</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Document metadata (for example file name, type, size, page count) needed for rendering and analysis.</li>
          <li>Document text extracted from uploaded/opened files to generate summaries, risk flags, and explanations.</li>
          <li>Product telemetry (for example feature usage and error events) to operate and improve reliability.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900">Accounts and sign-in providers</h2>
        <p>
          You can use DecoDocs anonymously in trial mode. You can also create or link an account using Email/Password,
          Google, Microsoft, or Apple sign-in where available. We store the minimum account profile and authentication
          metadata required to keep your session, enforce limits, and support account recovery.
        </p>
        <p>
          OAuth sign-in providers authenticate you through their own consent flows. We do not receive your provider
          password. Provider access and basic profile data are handled according to that provider&apos;s policies and your
          account settings.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Storage (Free vs Pro)</h2>
        <p>
          <strong>Free:</strong> we do not store your files as persistent document storage. Files are used to render and
          analyze the current session.
        </p>
        <p>
          <strong>Pro (optional):</strong> secure storage is available only when you explicitly choose to save documents for
          later access.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Third-party integrations (current and planned)</h2>
        <p>
          Some integrations are current and some are planned. Current sign-in integrations include Google, Microsoft, and
          Apple identity providers. Planned document-source integrations include Google Drive, OneDrive, and iCloud Drive.
        </p>
        <p>
          When you connect an integration, we request only the scopes needed for the selected feature. We do not perform
          background indexing of your cloud storage and we do not access files unless you explicitly choose them.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Retention and deletion</h2>
        <p>
          We retain only what is required to run the service, protect abuse limits, and support billing/account operations.
          If you use optional stored documents, retention and deletion follow your account settings and support requests.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Your controls</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use anonymous mode or create an account, then link/unlink supported providers in account settings.</li>
          <li>Choose free no-storage workflows or explicitly opt into paid storage features.</li>
          <li>Request data export, deletion, or account closure by contacting support.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
        <p>
          Questions or requests: <a className="underline" href="mailto:team@snapsign.com.au">team@snapsign.com.au</a>
        </p>
      </div>
    </section>
  );
};

export default PrivacyPage;
