import React from 'react';
import SectionHeader from './SectionHeader.jsx';
import { socialProofLogos, socialProofStats } from '../../lib/landingData.js';

const SocialProof = () => {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <SectionHeader
          eyebrow="Trusted teams"
          title="Teams use DecoDocs to review faster"
          description="From startups to procurement teams, we help busy leaders move faster without missing critical terms."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {socialProofStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-900/5"
            >
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-3xl border border-white/50 bg-white/70 px-6 py-5 text-xs uppercase tracking-[0.2em] text-slate-400">
          {socialProofLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
