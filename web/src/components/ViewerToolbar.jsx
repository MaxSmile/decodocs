import React from 'react';
import {
    HiLink,
    HiCloudUpload,
    HiCursorClick,
    HiPencil,
    HiAnnotation,
    HiPhotograph,
    HiCalendar,
    HiCheck,
    HiDownload,
    HiArrowRight,
} from 'react-icons/hi';

const TOOL_META = {
    select: {
        label: 'Select',
        tooltip: 'Select & Move — click to select placed items, then drag to reposition them',
        hint: 'Click on any placed element to select it. Drag to reposition.',
    },
    signature: {
        label: 'Sign',
        tooltip: 'Add Signature — create or place your signature on the document',
        hint: 'Click anywhere on the document to place your signature.',
    },
    text: {
        label: 'Text',
        tooltip: 'Add Text — insert a text field at the desired location',
        hint: 'Click on the document where you want to insert text.',
    },
    date: {
        label: 'Date',
        tooltip: "Insert Date — click to place today's date; then adjust its position if needed",
        hint: 'Click where you want the date. After placement: click the date to select it and drag to reposition.',
    },
    image: {
        label: 'Image',
        tooltip: 'Insert Image — add a photo or image to the document',
        hint: 'Click on the document where you want to place the image.',
    },
    checkmark: {
        label: 'Check',
        tooltip: 'Add Checkmark — insert a check mark (✓) on the document',
        hint: 'Click on a checkbox or field to place a checkmark.',
    },
};

const TOOL_ICONS = {
    select: HiCursorClick,
    signature: HiPencil,
    text: HiAnnotation,
    date: HiCalendar,
    image: HiPhotograph,
    checkmark: HiCheck,
};

const ViewerToolButton = ({ active, toolId, onClick }) => {
    const meta = TOOL_META[toolId] || { label: toolId, tooltip: toolId, hint: '' };
    const Icon = TOOL_ICONS[toolId] || HiCursorClick;
    return (
        <div className="relative group/vtool">
            <button
                onClick={onClick}
                title={meta.tooltip}
                data-testid={`viewer-tool-${toolId}`}
                aria-label={meta.tooltip}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${active
                    ? 'bg-slate-200/80 text-slate-800'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
            >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{meta.label}</span>
            </button>
            {/* Rich CSS tooltip */}
            <div
                role="tooltip"
                data-testid={`viewer-tool-tooltip-${toolId}`}
                className="pointer-events-none absolute z-[300] top-full left-1/2 -translate-x-1/2 mt-2 w-52 origin-top opacity-0 scale-95 group-hover/vtool:opacity-100 group-hover/vtool:scale-100 transition-all duration-150 bg-slate-800 text-white rounded-lg shadow-xl"
            >
                <div className="px-3 py-2.5">
                    <p className="font-semibold text-xs leading-tight">{meta.label}</p>
                    <p className="text-slate-300 text-[11px] leading-snug mt-1">{meta.hint}</p>
                </div>
                {/* Arrow pointing up */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-slate-800" />
            </div>
        </div>
    );
};

const ToolHintBar = ({ activeTool }) => {
    if (activeTool === 'select') return null;
    const meta = TOOL_META[activeTool];
    if (!meta) return null;
    return (
        <div
            data-testid="tool-hint-bar"
            className="h-8 px-4 flex items-center bg-blue-50 border-b border-blue-100 text-xs text-blue-700 gap-2 transition-all"
        >
            <span className="font-semibold">{meta.label}:</span>
            <span>{meta.hint}</span>
        </div>
    );
};

const ViewerToolbar = ({
    fileName,
    onShare,
    onSaveCloud,
    onDownload,
    onFinish,
    isCloudBusy,
    effectiveDocType,
    onOpenDocTypeSelector,
    activeTool,
    setActiveTool,
    onSignClick,
}) => {
    return (
        <div id="viewer-toolbar" className="flex flex-col bg-white border-b border-slate-200 z-20 relative">
            <div id="viewer-filename-bar" className="h-11 px-4 flex items-center justify-between border-b border-slate-100/80">
                <div className="flex items-center gap-3 min-w-0">
                    <span id="viewer-filename" className="font-semibold text-slate-800 text-sm truncate max-w-[320px]">
                        {fileName || 'Untitled Document'}
                    </span>
                    <div id="viewer-quick-actions" className="flex items-center gap-0.5 ml-1">
                        <button
                            id="btn-share-link"
                            onClick={onShare}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Send for signature — share this document with others for signing"
                        >
                            <HiLink className="w-4 h-4" />
                        </button>
                        <button
                            id="btn-save-decodocs"
                            onClick={onSaveCloud}
                            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isCloudBusy ? 'Saving…' : 'Save to DecoDocs cloud — store a copy in your DecoDocs account'}
                            disabled={isCloudBusy}
                        >
                            <HiCloudUpload className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div id="viewer-primary-actions" className="flex items-center gap-2">
                    <button
                        id="btn-download"
                        onClick={onDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download — save the document with your annotations as a PDF"
                        disabled={isCloudBusy}
                    >
                        <HiDownload className="w-3.5 h-3.5" />
                        Download
                    </button>
                    <button
                        id="btn-finish"
                        onClick={onFinish}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        title="Finish — finalise and close the document"
                    >
                        Finish
                        <HiArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div id="viewer-tools-bar" className="h-10 px-4 flex items-center bg-slate-50/60">
                <div id="viewer-doctype-bar" className="flex items-center">
                    <button
                        id="viewer-doctype-chip"
                        onClick={onOpenDocTypeSelector}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Change document type — affects which checks and analysis are run"
                    >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{effectiveDocType?.label || 'Contract / agreement (general)'}</span>
                        <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                <div className="w-px h-5 bg-slate-200 mx-3" />
                <div id="viewer-signing-tools" className="flex items-center gap-0.5">
                    <ViewerToolButton active={activeTool === 'select'} toolId="select" onClick={() => setActiveTool('select')} />
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <ViewerToolButton active={activeTool === 'signature'} toolId="signature" onClick={onSignClick} />
                    <ViewerToolButton active={activeTool === 'text'} toolId="text" onClick={() => setActiveTool('text')} />
                    <ViewerToolButton active={activeTool === 'date'} toolId="date" onClick={() => setActiveTool('date')} />
                    <ViewerToolButton active={activeTool === 'image'} toolId="image" onClick={() => setActiveTool('image')} />
                    <ViewerToolButton active={activeTool === 'checkmark'} toolId="checkmark" onClick={() => setActiveTool('checkmark')} />
                </div>
            </div>

            <ToolHintBar activeTool={activeTool} />
        </div>
    );
};

export default ViewerToolbar;
