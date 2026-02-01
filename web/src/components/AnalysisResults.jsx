import React from 'react';
import RiskItem from './RiskItem.jsx';

/**
 * Analysis results display component
 */
const AnalysisResults = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md mt-2.5">
      <h4 className="mt-0 text-gray-800 border-b border-gray-300 pb-2">
        Analysis Results
      </h4>
      <div className="mb-4">
        <h5 className="mt-0 text-gray-700 font-semibold mb-2">Document Summary</h5>
        <p className="text-gray-700">{analysis.summary}</p>
      </div>

      {analysis.risks && analysis.risks.length > 0 && (
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

      {analysis.recommendations && analysis.recommendations.length > 0 && (
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
