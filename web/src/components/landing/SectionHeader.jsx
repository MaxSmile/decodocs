import React from 'react';

const SectionHeader = ({ eyebrow, title, description, align = 'center' }) => {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow ? (
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
        {title}
      </h2>
      {description ? (
        <p className="text-base md:text-lg text-slate-600 max-w-2xl">
          {description}
        </p>
      ) : null}
    </div>
  );
};

export default SectionHeader;
