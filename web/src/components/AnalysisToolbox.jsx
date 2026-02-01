import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Analysis toolbox component with action buttons
 */
const AnalysisToolbox = ({
  onAnalyzeDocument,
  onAnalyzeByType,
  onExplainSelection,
  onHighlightRisks,
  onTranslateToPlainEnglish,
  isLoading,
  isAuthenticated,
  hasDocument,
}) => {
  const isDisabled = !hasDocument || !isAuthenticated || isLoading;

  let disabledReason = null;
  if (isLoading) disabledReason = 'Working…';
  else if (!hasDocument) disabledReason = 'Open a PDF to enable analysis tools.';
  else if (!isAuthenticated) disabledReason = 'Sign in to enable AI analysis (Free) and unlock Pro upgrades (OCR / deeper processing).';

  return (
    <div className="w-[350px] p-5 bg-gray-50 border-l border-gray-300 flex flex-col overflow-y-auto">
      <h3 className="mt-0 text-gray-800 border-b border-gray-300 pb-2.5">
        Document Analysis Tools
      </h3>

      {disabledReason && (
        <div className="mb-4 rounded border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <div className="font-semibold">Why are buttons disabled?</div>
          <div className="mt-1">{disabledReason}</div>
          {!isAuthenticated && (
            <div className="mt-2 flex gap-3 flex-wrap">
              <Link
                to="/sign-in"
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white no-underline"
              >
                Sign in
              </Link>
              <Link
                to="/pricing"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline"
              >
                See Free vs Pro
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-5">
        <button
          onClick={onAnalyzeByType}
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          {isLoading ? 'Analyzing...' : 'Type-specific analysis (recommended)'}
        </button>
        <button
          onClick={onAnalyzeDocument}
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          Legacy analysis (generic)
        </button>
        <button
          onClick={onExplainSelection}
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          Explain Selection
        </button>
        <button
          onClick={onHighlightRisks}
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          Highlight Risks
        </button>
        <button
          onClick={onTranslateToPlainEnglish}
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          Translate to Plain English
        </button>
        <button
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          Summarize Key Points
        </button>
        <button
          disabled={isDisabled}
          className="w-full bg-gray-600 text-white px-4 py-2.5 text-sm rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-left"
        >
          Suggest Improvements
        </button>
      </div>
    </div>
  );
};

export default AnalysisToolbox;
