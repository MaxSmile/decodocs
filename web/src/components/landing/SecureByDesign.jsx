import React from 'react';
import SectionHeader from './SectionHeader.jsx';

const securityFeatures = [
    {
        title: 'Your data is never used for training',
        description: 'We and our AI partners never use your documents to train models. Your data remains yours, contractually guaranteed.',
        icon: (
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        )
    },
    {
        title: 'Locked down, end-to-end',
        description: 'Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). Only you can access your documents.',
        icon: (
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        )
    },
    {
        title: 'Privacy-first architecture',
        description: 'DecoDocs is built with privacy as a core principle. Anonymous mode never stores files on our servers.',
        icon: (
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    },
    {
        title: 'Built for enterprise IT',
        description: 'Single Sign-On (SSO), audit logs, and custom retention polices available for enterprise teams.',
        icon: (
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        )
    }
];

const SecureByDesign = () => {
    return (
        <section className="px-6 py-24 bg-slate-50">
            <div className="mx-auto w-full max-w-6xl flex flex-col gap-12">
                <SectionHeader
                    eyebrow="Security"
                    title="Secure by design. Trusted by teams."
                    description="We take security seriously. Your documents are your business, keeping them safe is ours."
                    align="center"
                />

                <div className="grid md:grid-cols-2 gap-8">
                    {securityFeatures.map((feature) => (
                        <div key={feature.title} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-8 bg-slate-900 rounded-3xl text-white text-center">
                    <h3 className="text-2xl font-bold mb-4">Ready to start?</h3>
                    <p className="text-slate-300 mb-8 max-w-2xl mx-auto">Join thousands of professionals who trust DecoDocs to understand their documents faster.</p>
                    <div className="flex justify-center gap-4">
                        {/* This will be replaced by Button component usage if we were inside a parent that imported it, 
                     but for now since we are making components standalone, 
                     we will rely on parent to pass handlers or just standard links, 
                     or we can use our new Button here if we import it. */}
                        <a href="#hero" className="inline-flex items-center justify-center font-bold rounded-full px-8 py-4 text-base bg-white text-slate-900 hover:bg-slate-100 transition-colors">
                            Get Started for Free
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SecureByDesign;
