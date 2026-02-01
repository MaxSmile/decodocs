import React from 'react';

const ContactPage = () => {
  const waitlistHref =
    'mailto:contact@snapsign.com?subject=' + encodeURIComponent('DecoDocs signing waitlist');

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Contact</h1>
      <p className="mt-4 text-slate-700">
        For support, partnerships, or product feedback, email us at{' '}
        <a className="underline" href="mailto:team@snapsign.com.au">team@snapsign.com.au</a>.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Signing waitlist</h2>
        <p className="mt-2 text-slate-700">
          Want the signing workflow? Join the waitlist and tell us your use case.
        </p>
        <a
          className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
          href={waitlistHref}
        >
          Join the waitlist
        </a>
      </div>
    </section>
  );
};

export default ContactPage;
