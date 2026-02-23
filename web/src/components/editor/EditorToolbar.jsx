import React from 'react';
import {
  HiCursorClick,
  HiPencil,
  HiAnnotation,
  HiPhotograph,
  HiTemplate,
  HiCalendar,
  HiDownload,
  HiLink,
  HiUpload,
  HiTrash,
  HiArrowLeft,
  HiArrowRight,
  HiEye,
} from 'react-icons/hi';

const TOOL_META = {
  select: {
    label: 'Select',
    tooltip: 'Select & Move — click placed items to select, drag to reposition',
    hint: 'Click on any placed element to select it. Drag to move.',
  },
  text: {
    label: 'Text',
    tooltip: 'Add Text — click to insert a text annotation; then edit or move it',
    hint: 'Click on the document where you want to insert text. After placement you can click to edit or drag to reposition.',
  },
  signature: {
    label: 'Sign',
    tooltip: 'Create Signature — draw or type your signature, then place it',
    hint: 'Click on the document to place your signature. After placement click and drag to adjust.',
  },
  date: {
    label: 'Date',
    tooltip: "Insert Date — click to place today's date; then reposition if needed",
    hint: 'Click where you want the date. After placing it you can click and drag to move it.',
  },
  image: {
    label: 'Image',
    tooltip: 'Insert Image — add a photo or image to the document',
    hint: 'Click on the document where you want to place the image. Drag to reposition after placing.',
  },
  shape: {
    label: 'Shapes',
    tooltip: 'Add Shapes — insert rectangles, lines, or other shapes',
    hint: 'Click on the document to place a shape. Drag to reposition after placing.',
  },
};

const TOOL_ICONS = {
  select: HiCursorClick,
  text: HiAnnotation,
  signature: HiPencil,
  date: HiCalendar,
  image: HiPhotograph,
  shape: HiTemplate,
};

const ToolButton = ({ active, toolId, onClick }) => {
  const meta = TOOL_META[toolId] || { label: toolId, tooltip: toolId };
  const Icon = TOOL_ICONS[toolId] || HiCursorClick;
  return (
    <div className="relative group/etool">
      <button
        onClick={onClick}
        title={meta.tooltip}
        data-testid={`editor-tool-${toolId}`}
        aria-label={meta.tooltip}
        className={`flex items-center justify-center p-2.5 rounded-lg transition-all relative ${
          active
            ? 'bg-slate-200/80 text-slate-800'
            : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
        }`}
      >
        <Icon className="w-5 h-5" />
      </button>
      {/* Rich CSS tooltip */}
      <div
        role="tooltip"
        data-testid={`editor-tool-tooltip-${toolId}`}
        className="pointer-events-none absolute z-[300] top-full left-1/2 -translate-x-1/2 mt-2 w-52 origin-top opacity-0 scale-95 group-hover/etool:opacity-100 group-hover/etool:scale-100 transition-all duration-150 bg-slate-800 text-white rounded-lg shadow-xl"
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

const EditorToolHintBar = ({ activeTool }) => {
  if (activeTool === 'select') return null;
  const meta = TOOL_META[activeTool];
  if (!meta) return null;
  return (
    <div
      data-testid="editor-tool-hint-bar"
      className="h-8 px-4 flex items-center bg-blue-50 border-b border-blue-100 text-xs text-blue-700 gap-2 transition-all"
    >
      <span className="font-semibold">{meta.label}:</span>
      <span>{meta.hint}</span>
    </div>
  );
};

const EditorToolbar = ({
  fileName,
  activeTool,
  setActiveTool,
  onShare,
  onUpload,
  onCancel,
  onView,
  onDownload,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  onUndo,
  onRedo,
  onDelete,
}) => (
  <div className="flex flex-col bg-white border-b border-slate-200 z-20 relative font-sans">
    <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-800 text-base truncate max-w-[250px]">
            {fileName || 'Untitled Document'}
          </span>
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl/⌘+Z)"
              aria-label="Undo"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <HiArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl/⌘+Shift+Z)"
              aria-label="Redo"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <HiArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={!hasSelection}
              title="Delete selected (Del/Backspace)"
              aria-label="Delete selected"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onShare}
              title="Share — send this document to others for review or signing"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
            >
              <HiLink className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={onUpload}
              title="Upload — replace the current document with a new PDF"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <HiUpload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onView}
          title="View — switch to view mode"
          className="flex items-center gap-2 px-3 py-1.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-lg transition-colors"
        >
          <HiEye className="w-4 h-4" />
          View
        </button>
        <button
          onClick={onCancel}
          title="Cancel — discard changes and go back"
          className="px-3 py-1.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDownload}
          title="Download — save the edited document as a PDF"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
        >
          Download <HiDownload className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="h-12 flex items-center justify-center gap-1 bg-slate-50/50">
      <ToolButton active={activeTool === 'select'} toolId="select" onClick={() => setActiveTool('select')} />
      <div className="w-px h-5 bg-slate-300 mx-1"></div>
      <ToolButton active={activeTool === 'text'} toolId="text" onClick={() => setActiveTool('text')} />
      <ToolButton active={activeTool === 'signature'} toolId="signature" onClick={() => setActiveTool('signature')} />
      <ToolButton active={activeTool === 'date'} toolId="date" onClick={() => setActiveTool('date')} />
      <ToolButton active={activeTool === 'image'} toolId="image" onClick={() => setActiveTool('image')} />
      <ToolButton active={activeTool === 'shape'} toolId="shape" onClick={() => setActiveTool('shape')} />
    </div>
    <EditorToolHintBar activeTool={activeTool} />
  </div>
);

export default EditorToolbar;
