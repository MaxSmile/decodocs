import React, { useState } from 'react';
import SectionHeader from './SectionHeader.jsx';
import { faqs } from '../../lib/landingData.js';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <SectionHeader
          eyebrow="FAQ"
          title="Answers before you start"
          description="Everything you need to know about privacy, storage, and how DecoDocs helps you decode faster."
          align="left"
        />
        <div className="grid gap-4">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <button
                key={item.question}
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-lg shadow-slate-900/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">{item.question}</span>
                  <span className="text-xl text-slate-500">{isOpen ? '-' : '+'}</span>
                </div>
                {isOpen ? (
                  <p className="mt-4 text-sm text-slate-600">{item.answer}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
