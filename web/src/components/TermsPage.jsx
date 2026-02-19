import React from 'react';

const TermsPage = () => {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-600">Last updated: 17 February 2026</p>

      <div className="mt-10 space-y-6 text-slate-700 leading-relaxed">
        <p>
          These terms govern your use of DecoDocs provided by Snap Sign Pty Ltd. By using the service, you agree to these
          terms and to applicable provider terms when you use third-party sign-in or integrations.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Not legal advice</h2>
        <p>
          DecoDocs provides informational analysis and is not legal advice. For legal decisions, consult a qualified
          professional.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Accounts and authentication</h2>
        <p>
          You may use DecoDocs anonymously or with an account. Account sign-in may include Email/Password and third-party
          identity providers such as Google, Microsoft, and Apple when available. You are responsible for maintaining the
          security of your account and credentials.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Integrations and connected services</h2>
        <p>
          Integrations may include identity providers and document-source providers. Current and planned document-source
          integrations can include Google Drive, OneDrive, and iCloud Drive. Connected-service access is limited to scopes
          required for the requested feature and your explicit actions.
        </p>
        <p>
          You can revoke provider access through your provider account settings and, where available, within DecoDocs account
          settings.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Service scope</h2>
        <p>
          DecoDocs is a document understanding and analysis service. It is not a guaranteed legal review service, legal
          representation service, or substitute for professional counsel.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Acceptable use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Do not upload content you do not have the right to process.</li>
          <li>Do not attempt to abuse, probe, or disrupt the service.</li>
          <li>Do not use the service for illegal activity.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900">Limits and availability</h2>
        <p>
          Usage limits, feature access, and integration availability may differ by account tier and may change over time.
          We may limit access to protect service reliability, enforce abuse controls, or comply with legal obligations.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Availability and changes</h2>
        <p>
          The service may change over time. We may add, modify, or remove features. We may suspend access to protect the
          service or comply with law.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Snap Sign Pty Ltd is not liable for indirect or consequential losses
          arising from use of the service.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
        <p>
          Questions: <a className="underline" href="mailto:team@snapsign.com.au">team@snapsign.com.au</a>
        </p>
      </div>
    </section>
  );
};

export default TermsPage;
