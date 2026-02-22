import React from 'react';
import { HiExclamation, HiInformationCircle, HiCheckCircle } from 'react-icons/hi';

/**
 * Analysis results display – production "Contract Review" card layout.
 *
 * Renders risk-flagged items, plain-english explanations, and recommendations
 * in visually distinct cards that match the advertised DecoDocs analysis UI.
 */

const RiskFlaggedCard = ({ risk }) => (
  <div
    data-testid="risk-flagged-card"
    className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm"
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white">
        <HiExclamation className="w-4 h-4" />
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Risk Flagged</span>
    </div>
    <p className="text-slate-800 font-semibold text-sm leading-snug m-0">{risk.clause || risk.description}</p>
    {risk.description && risk.clause && (
      <p className="text-slate-600 text-xs mt-1 m-0">{risk.description}</p>
    )}
  </div>
);

const PlainEnglishCard = ({ text }) => (
  <div
    data-testid="plain-english-card"
    className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm ml-4"
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-400 text-white">
        <HiInformationCircle className="w-4 h-4" />
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Plain English</span>
    </div>
    <p className="text-slate-700 text-sm leading-snug m-0">{text}</p>
  </div>
);

const RecommendationCard = ({ text }) => (
  <div
    data-testid="recommendation-card"
    className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm"
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white">
        <HiCheckCircle className="w-4 h-4" />
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Recommendation</span>
    </div>
    <p className="text-slate-800 text-sm leading-snug m-0">{text}</p>
  </div>
);

const StatusPill = ({ label, variant }) => {
  const styles = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    loading: 'bg-blue-100 text-blue-700 border-blue-200',
    idle: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[variant] || styles.idle}`}>
      {variant === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {variant === 'loading' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
      {label}
    </span>
  );
};

const AnalysisResults = ({ analysis }) => {
  const meta = analysis?._meta || { status: analysis ? 'success' : 'idle' };

  const LegalDisclaimer = () => (
    <p className="text-[10px] text-slate-400 m-0 mt-4 leading-tight">
      DecoDocs provides informational analysis only. This is not legal advice. For legal decisions consult a qualified professional.
    </p>
  );

  if (!analysis || meta.status === 'idle') {
    return (
      <div data-testid="analysis-results" className="rounded-2xl bg-gradient-to-b from-amber-50/40 to-white border border-slate-200 p-5 shadow-sm mt-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Contract Review</span>
        </div>
        <p className="text-sm text-slate-500 m-0">
          No analysis yet. Tap <strong>Deep Analysis</strong> on the Tools tab to review this document.
        </p>
        <LegalDisclaimer />
      </div>
    );
  }

  if (meta.status === 'loading') {
    return (
      <div data-testid="analysis-results" className="rounded-2xl bg-gradient-to-b from-amber-50/40 to-white border border-slate-200 p-5 shadow-sm mt-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Contract Review</span>
          <StatusPill label="Analysing…" variant="loading" />
        </div>
        <div className="flex items-center gap-3 text-slate-600 py-6">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">{meta.message || 'Running AI analysis…'}</span>
        </div>
        <LegalDisclaimer />
      </div>
    );
  }

  if (meta.status === 'error') {
    return (
      <div data-testid="analysis-results" className="rounded-2xl bg-gradient-to-b from-red-50/30 to-white border border-red-200 p-5 shadow-sm mt-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">Analysis Error</span>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <div className="font-semibold">Analysis failed</div>
          <div className="mt-1">{meta.message || 'Request failed.'}</div>
        </div>
        <LegalDisclaimer />
      </div>
    );
  }

  const hasSummary = typeof analysis.summary === 'string' && analysis.summary.trim().length > 0;
  const hasRisks = Array.isArray(analysis.risks) && analysis.risks.length > 0;
  const hasRecommendations = Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0;
  const pageCount = analysis.pageCount || analysis.typeSpecific?.result?.extracted?.pageCount || null;

  return (
    <div data-testid="analysis-results" className="rounded-2xl bg-gradient-to-b from-amber-50/40 to-white border border-slate-200 p-5 shadow-sm mt-2">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Contract Review</span>
        {pageCount && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{pageCount} Pages</span>
        )}
      </div>

      {hasSummary && (
        <div className="mb-4">
          <p className="text-sm text-slate-700 leading-relaxed m-0">{analysis.summary}</p>
        </div>
      )}

      {hasRisks && (
        <div className="flex flex-col gap-3 mb-4">
          {analysis.risks.map((risk) => (
            <React.Fragment key={risk.id}>
              <RiskFlaggedCard risk={risk} />
              {risk.explanation && (
                <PlainEnglishCard text={risk.explanation} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {hasRecommendations && (
        <div className="flex flex-col gap-3 mb-4">
          {analysis.recommendations.map((rec, index) => (
            <RecommendationCard key={index} text={rec} />
          ))}
        </div>
      )}

      {analysis.typeSpecific && (
        <details className="mb-4 group">
          <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700 select-none">
            Type-specific details (beta)
          </summary>
          <div className="mt-2 text-xs text-slate-600 space-y-1 pl-2 border-l-2 border-slate-200">
            <div><strong>Type:</strong> {analysis.typeSpecific.effectiveTypeId || '—'}</div>
            {analysis.typeSpecific.validationTitle && (
              <div><strong>Spec:</strong> {analysis.typeSpecific.validationTitle}</div>
            )}
            {analysis.typeSpecific.result?.plainExplanation && (
              <div className="mt-2">
                <strong>Explanation:</strong>
                <p className="m-0 mt-1 text-slate-700">{analysis.typeSpecific.result.plainExplanation}</p>
              </div>
            )}
            {analysis.typeSpecific.result?.checks?.length > 0 && (
              <div className="mt-2">
                <strong>Checks:</strong>
                <ul className="list-none p-0 mt-1 space-y-1">
                  {analysis.typeSpecific.result.checks.map((c) => (
                    <li key={c.id} className="flex items-start gap-1.5">
                      <span className={c.ok ? 'text-emerald-600' : 'text-red-600'}>{c.ok ? '✓' : '✗'}</span>
                      <span>{c.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.typeSpecific.ok === false && analysis.typeSpecific.code && (
              <div className="mt-2 text-red-700">
                <strong>Blocked:</strong> {analysis.typeSpecific.code}
                {analysis.typeSpecific.requiredTier ? ` (requires ${analysis.typeSpecific.requiredTier})` : ''}
              </div>
            )}
            {analysis.typeSpecific.usage && (
              <div className="mt-2 text-slate-500">
                Tokens: {analysis.typeSpecific.usage.estimatedTokens ?? '—'} used · {analysis.typeSpecific.usage.remainingTokens ?? '—'} remaining
              </div>
            )}
          </div>
        </details>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <StatusPill label="AI decode complete" variant="success" />
        <span className="text-xs font-medium text-slate-500 border border-slate-200 rounded-md px-2.5 py-1 cursor-default">
          Ready to review
        </span>
      </div>

      <LegalDisclaimer />
    </div>
  );
};

export default AnalysisResults;
