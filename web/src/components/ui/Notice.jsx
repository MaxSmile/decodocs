import React from 'react';

const toneClasses = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
};

const Notice = ({ children, tone = 'neutral', className = '' }) => {
  const toneClass = toneClasses[tone] || toneClasses.neutral;
  return (
    <div className={`dd-notice ${toneClass} ${className}`}>
      {children}
    </div>
  );
};

export default Notice;
