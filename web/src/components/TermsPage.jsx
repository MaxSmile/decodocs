import React from 'react';

const TermsPage = () => {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-600">Last updated: 1 February 2026</p>

      <div className="mt-10 space-y-6 text-slate-700 leading-relaxed">
        <p>
          These terms govern use of DecoDocs provided by Snap Sign Pty Ltd. By using the service, you agree to these
          terms.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Not legal advice</h2>
        <p>
          DecoDocs provides informational analysis and is not legal advice. For legal decisions, consult a qualified
          professional.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">Acceptable use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Do not upload content you do not have the right to process.</li>
          <li>Do not attempt to abuse, probe, or disrupt the service.</li>
          <li>Do not use the service for illegal activity.</li>
        </ul>

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
