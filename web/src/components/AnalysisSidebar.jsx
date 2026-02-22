import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiSparkles,
    HiLightningBolt,
    HiShieldExclamation,
    HiTranslate,
    HiChatAlt2,
    HiDocumentText,
    HiPencilAlt,
    HiChevronRight,
    HiChevronLeft
} from 'react-icons/hi';
import AnalysisResults from './AnalysisResults';

const AnalysisSidebar = ({
    isOpen,
    onToggle,
    onAnalyzeDocument,
    onAnalyzeByType,
    onExplainSelection,
    onHighlightRisks,
    onTranslateToPlainEnglish,
    onSummarizeKeyPoints,
    onSuggestImprovements,
    isLoading,
    isAuthenticated,
    hasDocument,
    selectedDocument,
    analysisResults,
    textSelection
}) => {
    const MIN_WIDTH = 340;
    const MAX_WIDTH = 900;
    const getMaxWidth = () => Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.9));
    const clampWidth = (value) => Math.max(MIN_WIDTH, Math.min(value, getMaxWidth()));
    const [sidebarWidth, setSidebarWidth] = useState(420);
    const [isResizing, setIsResizing] = useState(false);

    const isDisabled = !hasDocument || !isAuthenticated || isLoading;
    let disabledReason = null;

    if (isLoading) {
        disabledReason = 'Working…';
    } else if (!hasDocument) {
        disabledReason = 'Open a PDF to enable analysis tools.';
    } else if (!isAuthenticated) {
        disabledReason = 'Sign in to enable AI analysis (Free) and unlock Pro upgrades (OCR / deeper processing).';
    }

    const tools = [
        {
            id: 'deep-analysis',
            icon: HiLightningBolt,
            label: 'Deep Analysis',
            railLabel: 'Deep Analysis',
            sublabel: 'Identify risks, obligations & summary',
            disabled: isDisabled,
            onClick: onAnalyzeByType,
        },
        {
            id: 'highlight-risks',
            icon: HiShieldExclamation,
            label: 'Highlight Risks',
            railLabel: 'Highlight Risks',
            disabled: isDisabled,
            onClick: onHighlightRisks,
        },
        {
            id: 'explain-selection',
            icon: HiChatAlt2,
            label: textSelection ? 'Explain Selection' : 'Explain Selection (Select text first)',
            railLabel: 'Explain Selection',
            sublabel: textSelection ? `"${textSelection.text.substring(0, 30)}..."` : null,
            disabled: isDisabled || !textSelection,
            onClick: onExplainSelection,
        },
        {
            id: 'plain-english',
            icon: HiTranslate,
            label: 'Plain English',
            railLabel: 'Plain English',
            disabled: isDisabled,
            onClick: onTranslateToPlainEnglish,
        },
        {
            id: 'summarize',
            icon: HiDocumentText,
            label: 'Summarize Key Points',
            railLabel: 'Summarize Key Points',
            disabled: isDisabled,
            onClick: onSummarizeKeyPoints,
        },
        {
            id: 'suggest-improvements',
            icon: HiPencilAlt,
            label: 'Suggest Improvements',
            railLabel: 'Suggest Improvements',
            disabled: isDisabled,
            onClick: onSuggestImprovements,
        },
    ];

    useEffect(() => {
        const onWindowResize = () => setSidebarWidth((prev) => clampWidth(prev));
        window.addEventListener('resize', onWindowResize);
        return () => window.removeEventListener('resize', onWindowResize);
    }, []);

    useEffect(() => {
        if (!isResizing) return undefined;

        const onMouseMove = (event) => {
            setSidebarWidth(clampWidth(window.innerWidth - event.clientX));
        };
        const onMouseUp = () => setIsResizing(false);

        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isResizing]);

    if (!isOpen) {
        return (
            <aside
                className="w-12 shrink-0 self-stretch border-l border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col items-center py-2 gap-2 relative z-20"
                aria-label="AI tools"
            >
                <button
                    onClick={onToggle}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    title="Open tools"
                    aria-label="Open tools"
                >
                    <HiChevronLeft className="w-5 h-5 text-slate-600" />
                </button>

                <div className="w-8 h-px bg-slate-200/70 my-1" />

                {tools.map((tool, index) => (
                    <RailToolButton
                        key={tool.id}
                        icon={tool.icon}
                        label={tool.railLabel || tool.label}
                        index={index}
                        disabled={tool.disabled}
                        onClick={() => {
                            onToggle();
                            if (!tool.disabled) {
                                // Let the sidebar render before kicking off long-running work.
                                setTimeout(() => tool.onClick(), 0);
                            }
                        }}
                    />
                ))}
            </aside>
        );
    }

    return (
        <div
            className="bg-white border-l border-slate-200 flex flex-col h-full shadow-xl transition-all relative z-20"
            style={{ width: `${sidebarWidth}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
        >
            <button
                type="button"
                onMouseDown={() => setIsResizing(true)}
                className="absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-col-resize bg-transparent"
                aria-label="Resize AI sidebar"
                title="Drag to resize"
            />

            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <HiSparkles className="text-purple-600" />
                    AI Assistant
                </h3>
                <button onClick={onToggle} className="p-1 hover:bg-slate-200 rounded">
                    <HiChevronRight className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                <div className="flex flex-col gap-3">
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tools</h4>
                    </div>

                    {disabledReason && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <div className="font-semibold text-slate-900">Why are buttons disabled?</div>
                            <div className="mt-1">{disabledReason}</div>
                            {!isAuthenticated && hasDocument && !isLoading && (
                                <div className="mt-3 flex gap-2.5 flex-wrap">
                                    <Link
                                        to="/sign-in"
                                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white no-underline"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        to="/pricing"
                                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline"
                                    >
                                        See Free vs Pro
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {tools.map((tool, idx) => (
                        <React.Fragment key={tool.id}>
                            <ActionButton
                                icon={tool.icon}
                                label={tool.label}
                                sublabel={tool.sublabel}
                                onClick={tool.onClick}
                                disabled={tool.disabled}
                                primary={idx === 0}
                            />
                            {idx === 0 || idx === 1 ? <div className="h-px bg-slate-100 my-2" /> : null}
                        </React.Fragment>
                    ))}

                    <div className="h-px bg-slate-200 my-3" />

                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Results</h4>
                    </div>
                    <div className="prose prose-sm max-w-none">
                        {selectedDocument && analysisResults[selectedDocument.id] ? (
                            <AnalysisResults analysis={analysisResults[selectedDocument.id]} />
                        ) : (
                            <div className="text-center text-slate-500 mt-6">No analysis results yet. Run a tool to see output here.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActionButton = ({ icon: Icon, label, sublabel, onClick, disabled, primary }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${primary
            ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 shadow-md'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className={`p-2 rounded-lg ${primary ? 'bg-white/10' : 'bg-slate-100'} shrink-0`}>
            <Icon className={`w-5 h-5 ${primary ? 'text-white' : 'text-slate-600'}`} />
        </div>
        <div>
            <div className="font-semibold text-sm">{label}</div>
            {sublabel && <div className={`text-xs mt-0.5 ${primary ? 'text-slate-300' : 'text-slate-500'}`}>{sublabel}</div>}
        </div>
    </button>
);

const RailToolButton = ({ icon: Icon, label, index, disabled, onClick }) => {
    const fallback = (label || '').trim().slice(0, 1).toUpperCase() || String(index + 1);

    return (
        <button
            type="button"
            onClick={onClick}
            aria-disabled={disabled}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${disabled
                ? 'border-slate-200 bg-slate-50 text-slate-400'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
            title={label}
            aria-label={label}
        >
            {Icon ? (
                <Icon className={`w-5 h-5 ${disabled ? 'text-slate-400' : 'text-slate-600'}`} />
            ) : (
                <span className="text-xs font-bold text-slate-600">{fallback}</span>
            )}
        </button>
    );
};

export default AnalysisSidebar;
