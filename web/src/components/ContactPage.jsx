import React from 'react';

const ContactPage = () => {
  const authSupportHref =
    'mailto:team@snapsign.com.au?subject=' + encodeURIComponent('DecoDocs account or sign-in support');
  const integrationsSupportHref =
    'mailto:team@snapsign.com.au?subject=' + encodeURIComponent('DecoDocs integration request');

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Contact</h1>
      <p className="mt-4 text-slate-700">
        For support, partnerships, account help, or product feedback, email us at{' '}
        <a className="underline" href="mailto:team@snapsign.com.au">team@snapsign.com.au</a>.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Account and OAuth support</h2>
        <p className="mt-2 text-slate-700">
          Need help with account creation, sign-in, provider linking, or provider access issues? We currently support
          Email/Password plus Google, Microsoft, and Apple sign-in where available.
        </p>

        <p className="mt-4 text-slate-700">
          Support email: <a className="underline" href={authSupportHref}>team@snapsign.com.au</a>
          <span className="ml-2 text-xs text-slate-500">(mailto)</span>
        </p>

        <div className="mt-4 rounded-md bg-slate-50 p-3 border border-slate-100 text-sm text-slate-700">
          <p className="font-medium">Existing address</p>
          <p><code>team@snapsign.com.au</code></p>

          <p className="font-medium mt-3">Forwarding address</p>
          <p><code>us11-d77f8d54a3-485b264cff@inbound.mailchimpapp.net</code></p>

          <p className="font-medium mt-3">Domain verified</p>
          <p>Verified — You have permission to send email from a <code>snapsign.com.au</code> address.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Integration requests</h2>
        <p className="mt-2 text-slate-700">
          Want a specific integration? Tell us your workflow. Planned roadmap integrations include Google Drive,
          OneDrive, and iCloud Drive import flows.
        </p>
        <a
          className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800"
          href={integrationsSupportHref}
        >
          Request an integration
        </a>
      </div>


    </section>
  );
};

export default ContactPage;
