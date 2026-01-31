import React from 'react';
import SectionHeader from './SectionHeader.jsx';
import { featureGridItems } from '../../lib/landingData.js';

const FeatureGrid = () => {
  return (
    <section id="features" className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <SectionHeader
          eyebrow="Product"
          title="Every insight you need to move faster"
          description="Built for modern teams that need clarity, speed, and secure workflows."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureGridItems.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <span className="text-xs font-semibold">AI</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
