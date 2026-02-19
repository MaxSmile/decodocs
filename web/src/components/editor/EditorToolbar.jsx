import React from 'react';
import {
  HiCursorClick,
  HiPencil,
  HiAnnotation,
  HiPhotograph,
  HiTemplate,
  HiDownload,
  HiLink,
  HiUpload,
} from 'react-icons/hi';

const ToolButton = ({ active, icon: Icon, label, onClick, tooltip }) => (
  <button
    onClick={onClick}
    title={tooltip || label}
    className={`flex items-center justify-center p-2.5 rounded-lg transition-all relative ${
      active
        ? 'bg-slate-200/80 text-slate-800'
        : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
    }`}
  >
    <Icon className="w-5 h-5" />
  </button>
);

const EditorToolbar = ({
  fileName,
  activeTool,
  setActiveTool,
  onShare,
  onUpload,
  onCancel,
  onDownload,
}) => (
  <div className="flex flex-col bg-white border-b border-slate-200 z-20 relative font-sans">
    <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-800 text-base truncate max-w-[250px]">
            {fileName || 'Untitled Document'}
          </span>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
            >
              <HiLink className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={onUpload}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <HiUpload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
        >
          Download <HiDownload className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="h-12 flex items-center justify-center gap-1 bg-slate-50/50">
      <ToolButton
        active={activeTool === 'select'}
        icon={HiCursorClick}
        label="Select"
        onClick={() => setActiveTool('select')}
        tooltip="Select & Move"
      />
      <div className="w-px h-5 bg-slate-300 mx-1"></div>
      <ToolButton
        active={activeTool === 'text'}
        icon={HiAnnotation}
        label="Text"
        onClick={() => setActiveTool('text')}
        tooltip="Add Text"
      />
      <ToolButton
        active={activeTool === 'signature'}
        icon={HiPencil}
        label="Sign"
        onClick={() => setActiveTool('signature')}
        tooltip="Create Signature"
      />
      <ToolButton
        active={activeTool === 'image'}
        icon={HiPhotograph}
        label="Image"
        onClick={() => setActiveTool('image')}
        tooltip="Insert Image"
      />
      <ToolButton
        active={activeTool === 'shape'}
        icon={HiTemplate}
        label="Shapes"
        onClick={() => setActiveTool('shape')}
        tooltip="Add Shapes"
      />
    </div>
  </div>
);

export default EditorToolbar;
