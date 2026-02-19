import React from 'react';
import RiskItem from './RiskItem.jsx';

/**
 * Analysis results display component.
 *
 * The DocumentViewer stores analysis per-document with a small `_meta` status object.
 *
 * Shape:
 * {
 *   _meta?: { status: 'idle'|'loading'|'success'|'error', message?: string }
 *   summary?: string
 *   risks?: Array<...>
 *   recommendations?: string[]
 *   typeSpecific?: object
 * }
 */
const AnalysisResults = ({ analysis }) => {
  const meta = analysis?._meta || { status: analysis ? 'success' : 'idle' };
  const LegalDisclaimer = () => (
    <p className="text-xs text-gray-500 m-0 mb-2">
      DecoDocs provides informational analysis and is not legal advice. For legal decisions, consult a qualified professional.
    </p>
  );

  // Empty state
  if (!analysis || meta.status === 'idle') {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md mt-2.5">
        <LegalDisclaimer />
        <h4 className="mt-0 text-gray-800 border-b border-gray-300 pb-2">
          Analysis Results
        </h4>
        <p className="text-gray-700 m-0">No analysis yet. Run “Type-specific analysis (recommended)” to see results here.</p>
      </div>
    );
  }

  // Loading state
  if (meta.status === 'loading') {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md mt-2.5">
        <LegalDisclaimer />
        <h4 className="mt-0 text-gray-800 border-b border-gray-300 pb-2">
          Analysis Results
        </h4>
        <div className="flex items-center gap-3 text-gray-700">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <div>{meta.message || 'Analyzing…'}</div>
        </div>
      </div>
    );
  }

  // Error state
  if (meta.status === 'error') {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md mt-2.5">
        <LegalDisclaimer />
        <h4 className="mt-0 text-gray-800 border-b border-gray-300 pb-2">
          Analysis Results
        </h4>
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <div className="font-semibold">Analysis failed</div>
          <div className="mt-1">{meta.message || 'Request failed.'}</div>
        </div>
      </div>
    );
  }

  const hasSummary = typeof analysis.summary === 'string' && analysis.summary.trim().length > 0;
  const hasRisks = Array.isArray(analysis.risks) && analysis.risks.length > 0;
  const hasRecommendations = Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md mt-2.5">
      <LegalDisclaimer />
      <h4 className="mt-0 text-gray-800 border-b border-gray-300 pb-2">
        Analysis Results
      </h4>

      {!hasSummary && !analysis.typeSpecific ? (
        <p className="text-gray-700 m-0">No results were returned yet.</p>
      ) : null}

      {hasSummary && (
        <div className="mb-4">
          <h5 className="mt-0 text-gray-700 font-semibold mb-2">Document Summary</h5>
          <p className="text-gray-700">{analysis.summary}</p>
        </div>
      )}

      {hasRisks && (
        <div className="mb-4">
          <h5 className="mt-0 text-gray-700 font-semibold mb-2">Identified Risks</h5>
          {analysis.risks.map((risk) => (
            <RiskItem key={risk.id} risk={risk} />
          ))}
        </div>
      )}

      {analysis.typeSpecific && (
        <div className="mb-4">
          <h5 className="mt-0 text-gray-700 font-semibold mb-2">Type-specific (beta)</h5>
          <div className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
            <div><strong>effectiveTypeId:</strong> {analysis.typeSpecific.effectiveTypeId || '—'}</div>
            <div><strong>validationSlug:</strong> {analysis.typeSpecific.validationSlug || '—'}</div>
            <div><strong>validationTitle:</strong> {analysis.typeSpecific.validationTitle || '—'}</div>

            {analysis.typeSpecific.result?.plainExplanation ? (
              <div style={{ marginTop: 8 }}>
                <strong>explanation:</strong>
                <div>{analysis.typeSpecific.result.plainExplanation}</div>
              </div>
            ) : null}

            {analysis.typeSpecific.usage ? (
              <div style={{ marginTop: 8 }}>
                <strong>usage:</strong>
                <div>
                  estimatedTokens: {analysis.typeSpecific.usage.estimatedTokens ?? '—'}
                  {' · '}
                  remainingTokens: {analysis.typeSpecific.usage.remainingTokens ?? '—'}
                </div>
              </div>
            ) : null}

            {analysis.typeSpecific.ok === false && (analysis.typeSpecific.code || analysis.typeSpecific.requiredTier) ? (
              <div style={{ marginTop: 8, color: '#991b1b' }}>
                <strong>blocked:</strong> {analysis.typeSpecific.code || '—'}
                {analysis.typeSpecific.requiredTier ? ` (required: ${analysis.typeSpecific.requiredTier})` : ''}
              </div>
            ) : null}

            {analysis.typeSpecific.result?.checks?.length ? (
              <div style={{ marginTop: 8 }}>
                <strong>checks:</strong>
                <ul className="list-none p-0" style={{ marginTop: 6 }}>
                  {analysis.typeSpecific.result.checks.map((c) => (
                    <li key={c.id} className="mb-2 p-2 border border-gray-200 rounded">
                      <div><strong>{c.ok ? 'OK' : 'FAIL'}:</strong> {c.message}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {analysis.typeSpecific.result?.extracted && Object.keys(analysis.typeSpecific.result.extracted).length ? (
              <div style={{ marginTop: 8 }}>
                <strong>extracted:</strong>
                <pre style={{ marginTop: 6, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 10, borderRadius: 10, overflow: 'auto' }}>
                  {JSON.stringify(analysis.typeSpecific.result.extracted, null, 2)}
                </pre>
              </div>
            ) : null}

            {analysis.typeSpecific.message ? (
              <div style={{ marginTop: 8 }}>
                <strong>message:</strong>
                <div>{analysis.typeSpecific.message}</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {hasRecommendations && (
        <div>
          <h5 className="mt-0 text-gray-700 font-semibold mb-2">Recommendations</h5>
          <ul className="list-none p-0">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="mb-4 p-2.5 border border-gray-300 rounded">
                <div className="text-gray-700">{rec}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
