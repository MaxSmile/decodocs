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

const ViewerToolButton = ({ active, icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${active
            ? 'bg-slate-200/80 text-slate-800'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

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
            {/* Row 1: Filename + icons (left) | Download + Finish (right) */}
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
                            title="Send for signature"
                        >
                            <HiLink className="w-4 h-4" />
                        </button>
                        <button
                            id="btn-save-decodocs"
                            onClick={onSaveCloud}
                            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isCloudBusy ? 'Working...' : 'Save to DecoDocs'}
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
                        disabled={isCloudBusy}
                    >
                        <HiDownload className="w-3.5 h-3.5" />
                        Download
                    </button>
                    <button
                        id="btn-finish"
                        onClick={onFinish}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        Finish
                        <HiArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Row 2: Doc type chip (left) + Signing tools (center) */}
            <div id="viewer-tools-bar" className="h-10 px-4 flex items-center bg-slate-50/60">
                <div id="viewer-doctype-bar" className="flex items-center">
                    <button
                        id="viewer-doctype-chip"
                        onClick={onOpenDocTypeSelector}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Click to change document type"
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
                    <ViewerToolButton
                        active={activeTool === 'select'}
                        icon={HiCursorClick}
                        label="Select"
                        onClick={() => setActiveTool('select')}
                    />
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <ViewerToolButton
                        active={activeTool === 'signature'}
                        icon={HiPencil}
                        label="Sign"
                        onClick={onSignClick}
                    />
                    <ViewerToolButton
                        active={activeTool === 'text'}
                        icon={HiAnnotation}
                        label="Text"
                        onClick={() => setActiveTool('text')}
                    />
                    <ViewerToolButton
                        active={activeTool === 'date'}
                        icon={HiCalendar}
                        label="Date"
                        onClick={() => setActiveTool('date')}
                    />
                    <ViewerToolButton
                        active={activeTool === 'image'}
                        icon={HiPhotograph}
                        label="Image"
                        onClick={() => setActiveTool('image')}
                    />
                    <ViewerToolButton
                        active={activeTool === 'checkmark'}
                        icon={HiCheck}
                        label="Check"
                        onClick={() => setActiveTool('checkmark')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ViewerToolbar;
