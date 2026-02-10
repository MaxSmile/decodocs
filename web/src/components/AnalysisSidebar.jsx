import React, { useState } from 'react';
import {
    HiSparkles,
    HiLightningBolt,
    HiShieldExclamation,
    HiTranslate,
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
    isLoading,
    isAuthenticated,
    hasDocument,
    selectedDocument,
    analysisResults
}) => {
    const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'results'

    // Auto-switch to results tab when analysis is present
    React.useEffect(() => {
        if (selectedDocument && analysisResults[selectedDocument.id]) {
            setActiveTab('results');
        }
    }, [analysisResults, selectedDocument]);

    const isDisabled = !hasDocument || !isAuthenticated || isLoading;

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-l-lg p-2 shadow-md hover:bg-slate-50 z-20"
                title="Open AI Sidebar"
            >
                <HiChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
        );
    }

    return (
        <div className="w-[350px] bg-white border-l border-slate-200 flex flex-col h-full shadow-xl transition-all relative z-20">
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

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('tools')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'tools'
                            ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Tools
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    disabled={!selectedDocument || !analysisResults[selectedDocument.id]}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'results'
                            ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                            : 'text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                >
                    Results
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                {activeTab === 'tools' ? (
                    <div className="flex flex-col gap-3">
                        {!hasDocument && (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center text-sm text-slate-500">
                                Open a document to use AI tools
                            </div>
                        )}

                        {hasDocument && !isAuthenticated && (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
                                Sign in to use AI features.
                            </div>
                        )}

                        <ActionButton
                            icon={HiLightningBolt}
                            label="Deep Analysis"
                            sublabel="Identify risks, obligations & summary"
                            onClick={() => { onAnalyzeByType(); setActiveTab('results'); }}
                            disabled={isDisabled}
                            primary
                        />

                        <div className="h-px bg-slate-100 my-2" />

                        <ActionButton
                            icon={HiShieldExclamation}
                            label="Highlight Risks"
                            onClick={onHighlightRisks}
                            disabled={isDisabled}
                        />
                        <ActionButton
                            icon={HiTranslate}
                            label="Plain English"
                            onClick={onTranslateToPlainEnglish}
                            disabled={isDisabled}
                        />
                    </div>
                ) : (
                    <div className="prose prose-sm">
                        {selectedDocument && analysisResults[selectedDocument.id] ? (
                            <AnalysisResults analysis={analysisResults[selectedDocument.id]} />
                        ) : (
                            <div className="text-center text-slate-500 mt-10">No analysis results yet. Run a tool to see output here.</div>
                        )}
                    </div>
                )}
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

export default AnalysisSidebar;
