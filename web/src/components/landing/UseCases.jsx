import React from 'react';
import SectionHeader from './SectionHeader.jsx';
import { useCases } from '../../lib/landingData.js';

const UseCases = () => {
  return (
    <section id="use-cases" className="px-6 py-24 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <SectionHeader
          eyebrow="Use cases"
          title="Built for high-stakes decisions"
          description="DecoDocs supports every team that needs clean answers before signing or committing."
          align="left"
        />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <div
              key={useCase.title}
              className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 group-hover:text-slate-600 transition-colors">
                <span>Use case</span>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-amber-600 transition-colors">{useCase.title}</h3>
              <p className="text-base text-slate-600 leading-relaxed">{useCase.description}</p>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center text-sm font-bold text-slate-900 opacity-60 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
