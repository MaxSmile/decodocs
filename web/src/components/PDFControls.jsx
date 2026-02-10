import React from 'react';
import {
  HiChevronLeft,
  HiChevronRight,
  HiZoomIn,
  HiZoomOut,
  HiUpload,
  HiPencil
} from 'react-icons/hi';

const PDFControls = ({
  onFileSelect,
  onEdit,
  pageNumber,
  numPages,
  pageScale,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  fileInputRef,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-white/10 z-30 transition-all hover:bg-slate-900 text-white">
      {/* File Actions */}
      <div className="flex items-center gap-2 pr-3 border-r border-white/20">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors tooltip-trigger"
          title="Open PDF"
        >
          <HiUpload className="w-5 h-5" />
        </button>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPreviousPage}
          disabled={pageNumber <= 1}
          className="p-1 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-medium text-white min-w-[4ch] text-center select-none font-mono tracking-wide">
          {pageNumber} <span className="text-slate-400 font-normal">/ {numPages || '-'}</span>
        </span>

        <button
          onClick={onNextPage}
          disabled={pageNumber >= numPages}
          className="p-1 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 pl-3 border-l border-white/20">
        <button
          onClick={onZoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Zoom Out"
        >
          <HiZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-slate-400 w-10 text-center select-none">
          {Math.round(pageScale * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Zoom In"
        >
          <HiZoomIn className="w-4 h-4" />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default PDFControls;
