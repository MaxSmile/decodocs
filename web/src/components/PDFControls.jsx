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
    <div
      id="viewer-page-controls"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/85 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/10 z-30 text-white text-xs"
    >
      {/* File Actions */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-1 bg-transparent text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        title="Open PDF"
      >
        <HiUpload className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-3.5 bg-white/20" />

      {/* Page Navigation */}
      <button
        onClick={onPreviousPage}
        disabled={pageNumber <= 1}
        className="p-0.5 bg-transparent rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors text-white"
      >
        <HiChevronLeft className="w-3.5 h-3.5" />
      </button>

      <span className="font-medium text-white min-w-[3ch] text-center select-none tabular-nums">
        {pageNumber} <span className="text-slate-400">/ {numPages || '-'}</span>
      </span>

      <button
        onClick={onNextPage}
        disabled={pageNumber >= numPages}
        className="p-0.5 bg-transparent rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors text-white"
      >
        <HiChevronRight className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-3.5 bg-white/20" />

      {/* Zoom Controls */}
      <button
        onClick={onZoomOut}
        className="p-0.5 bg-transparent text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        title="Zoom Out"
      >
        <HiZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="font-medium text-slate-400 w-8 text-center select-none tabular-nums">
        {Math.round(pageScale * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="p-0.5 bg-transparent text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        title="Zoom In"
      >
        <HiZoomIn className="w-3.5 h-3.5" />
      </button>

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
