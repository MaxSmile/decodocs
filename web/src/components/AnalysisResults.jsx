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
