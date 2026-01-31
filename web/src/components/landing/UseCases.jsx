import React from 'react';
import SectionHeader from './SectionHeader.jsx';
import { useCases } from '../../lib/landingData.js';

const UseCases = () => {
  return (
    <section id="use-cases" className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <SectionHeader
          eyebrow="Use cases"
          title="Built for high-stakes decisions"
          description="DecoDocs supports every team that needs clean answers before signing or committing." 
          align="left"
        />
        <div className="grid gap-6 md:grid-cols-2">
          {useCases.map((useCase, index) => (
            <div
              key={useCase.title}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-900/5"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>Use case</span>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{useCase.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
