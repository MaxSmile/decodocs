import React from 'react';
import SectionHeader from './SectionHeader.jsx';
import { howItWorksSteps } from '../../lib/landingData.js';
import { HiUpload, HiSparkles, HiCheckCircle } from 'react-icons/hi';

const HowItWorks = () => {
  const stepIcons = [HiUpload, HiSparkles, HiCheckCircle];

  return (
    <section id="how-it-works" className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to clarity"
          description="No onboarding, no templates. Drop in a document and get structured insights within seconds."
          align="left"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Step {index + 1}
                </span>
                {React.createElement(stepIcons[index], { className: "w-6 h-6 text-slate-400" })}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
