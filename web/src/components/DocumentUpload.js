import React, { useRef } from 'react';

// NOTE: This component is currently not wired into the main UI.
// It is kept here as an optional multi-file upload surface.
// (Written without JSX so tooling that parses .js without JSX support doesn't fail.)

const el = React.createElement;

const DocumentUpload = ({ onFilesSelected, selectedFiles = [], onSelectFile }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    onFilesSelected?.(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    onFilesSelected?.(files);
  };

  const openPicker = () => fileInputRef.current?.click();

  return el(
    'div',
    { className: 'document-upload-component' },
    el(
      'div',
      {
        className: 'upload-area',
        onDragOver: handleDragOver,
        onDrop: handleDrop,
        onClick: openPicker,
      },
      el('div', { className: 'upload-icon', 'aria-hidden': true }, 'Document'),
      el('p', null, 'Click to select files or drag and drop'),
      el('p', { className: 'file-types' }, 'Supports: PDF, DOC, DOCX, TXT'),
      el('input', {
        type: 'file',
        ref: fileInputRef,
        accept: '.pdf,.doc,.docx,.txt',
        multiple: true,
        onChange: handleFileChange,
        style: { display: 'none' },
      })
    ),
    selectedFiles.length > 0
      ? el(
          'div',
          { className: 'documents-list' },
          el('h3', null, `Your Documents (${selectedFiles.length})`),
          el(
            'div',
            { className: 'document-items' },
            ...selectedFiles.map((doc, index) =>
              el(
                'div',
                {
                  key: String(index),
                  className: 'document-item',
                  onClick: () => onSelectFile?.(doc),
                },
                el('span', { className: 'document-name' }, doc?.name || 'Untitled'),
                el('span', { className: 'document-size' }, `${((doc?.size || 0) / 1024).toFixed(1)} KB`)
              )
            )
          )
        )
      : null
  );
};

export default DocumentUpload;
