import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PDFControls from './PDFControls';
import PDFDisplay from './PDFDisplay';
import PDFDropzone from './PDFDropzone';
import PageThumbnails from './PageThumbnails';
import EditorToolbar from './editor/EditorToolbar.jsx';
import EditorOverlay from './editor/EditorOverlay.jsx';
import AppDialog from './ui/AppDialog.jsx';
import { usePdfJs } from '../hooks/usePdfJs';
import { useSignMode } from '../hooks/useSignMode.js';
import { buildEditedPdfBytes } from '../utils/pdfExport.js';
import { useOverlayHotkeys } from '../hooks/useOverlayHotkeys.js';
import { usePageManagement } from '../hooks/usePageManagement.js';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const {
    pdfLibLoaded,
    pdfDoc,
    numPages,
    pageNumber,
    pageScale,
    isLoading: isPdfLoading,
    loadingMessage,
    loadPdfFromBlob,
    loadTestPdf,
    navigation,
  } = usePdfJs();

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dialog, setDialog] = useState(null);
  
  // Page management state
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageRotations, setPageRotations] = useState({});
  const pdfBytesRef = useRef(null);
  
  const {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    selectedItemId,
    setSelectedItemId,
    handleCanvasClick,
    startDrag,
    deleteSelectedItem,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useSignMode({
    initialSignatures: location.state?.overlays?.signatures,
    initialAnnotations: location.state?.overlays?.annotations,
  });

  useOverlayHotkeys({
    enabled: true,
    canUndo,
    canRedo,
    hasSelection: !!selectedItemId,
    onUndo: undo,
    onRedo: redo,
    onDelete: deleteSelectedItem,
  });

  // Load document on mount
  useEffect(() => {
    if (location.state?.document && !pdfDoc && pdfLibLoaded) {
      const doc = location.state.document;
      setSelectedDocument(doc);
      if (doc.file) {
        loadPdfFromBlob(doc.file).catch(console.error);
      }
      return;
    }

    if (location.pathname.includes('test-docs') && pdfLibLoaded && !pdfDoc) {
      const fileName = location.pathname.split('/').pop();
      if (fileName?.endsWith('.pdf')) {
        loadTestPdf(fileName).then((result) => {
          if (result) {
            setSelectedDocument({ name: fileName, id: 'test-doc', type: 'application/pdf' });
          }
        });
      }
      return;
    }

    if (documentId && pdfLibLoaded && !pdfDoc && !location.pathname.includes('test-docs')) {
      setSelectedDocument({
        id: documentId,
        name: `Document_${documentId}.pdf`,
        type: 'application/pdf',
        file: null,
      });
    }
  }, [location, documentId, pdfLibLoaded, pdfDoc, loadPdfFromBlob, loadTestPdf]);

  // Store PDF bytes when document loads
  useEffect(() => {
    if (pdfDoc && selectedDocument?.file) {
      selectedDocument.file.arrayBuffer().then(buffer => {
        const bytes = new Uint8Array(buffer);
        setPdfBytes(bytes);
        pdfBytesRef.current = bytes;
      });
    }
  }, [pdfDoc, selectedDocument]);

  useEffect(() => {
    const onShowGate = (event) => {
      const detail = event?.detail || {};
      setDialog({
        title: detail.title || 'Notice',
        message: detail.message || '',
        primaryLabel: detail.primaryLabel || 'OK',
        primaryTo: detail.primaryTo || null,
        secondaryLabel: detail.secondaryLabel || null,
        secondaryTo: detail.secondaryTo || null,
      });
    };

    window.addEventListener('decodocs:show-gate', onShowGate);
    return () => window.removeEventListener('decodocs:show-gate', onShowGate);
  }, []);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length === 0) return;

    const file = pdfFiles[0];
    const newDocument = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    };

    setSelectedDocument(newDocument);
    loadPdfFromBlob(file);
  };

  const handleDownloadEditedPdf = async () => {
    if (!pdfDoc) {
      setDialog({
        title: 'No PDF open',
        message: 'Open a PDF first.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
      return;
    }

    try {
      const baseBytes = await pdfDoc.getData();
      const editedBytes = await buildEditedPdfBytes({
        pdfBytes: baseBytes,
        pageScale,
        signatures,
        annotations,
      });
      const blob = new Blob([editedBytes], { type: 'application/pdf' });
      const name = (selectedDocument?.name || 'document.pdf').replace(/\\.pdf$/i, '');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}-edited.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to export edited PDF:', err);
      setDialog({
        title: 'Export failed',
        message: err?.message || 'Unable to export edited PDF.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
    }
  };

  const handleThumbnailClick = (targetPageNum) => {
    navigation.setPageNumber(targetPageNum);
    const pageElement = document.getElementById(`pdf-page-${targetPageNum}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle PDF bytes change from page operations
  const handlePdfBytesChange = useCallback(async (newBytes) => {
    if (!newBytes) return;
    
    setPdfBytes(newBytes);
    pdfBytesRef.current = newBytes;
    
    // Reload the PDF document with new bytes
    try {
      const blob = new Blob([newBytes], { type: 'application/pdf' });
      const file = new File([blob], selectedDocument?.name || 'document.pdf', { type: 'application/pdf' });
      await loadPdfFromBlob(file);
    } catch (err) {
      console.error('Failed to reload PDF after page operation:', err);
      setDialog({
        title: 'Page Operation Failed',
        message: 'The page operation completed but the document could not be refreshed. Please try again.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
    }
  }, [loadPdfFromBlob, selectedDocument, setDialog]);

  // Handle page count change
  const handlePageCountChange = useCallback((updater) => {
    // This will be handled by the PDF reload
  }, []);

  // Handle page change
  const handlePageChangeFromOperation = useCallback((updater) => {
    const newPage = typeof updater === 'function' ? updater(pageNumber) : updater;
    navigation.setPageNumber(newPage);
    handleThumbnailClick(newPage);
  }, [pageNumber, navigation]);

  // Page management hook
  const {
    isProcessing: isPageOperationProcessing,
    error: pageOperationError,
    setPdfBytes: setPageManagementPdfBytes,
    duplicatePage: handleDuplicatePage,
    rotatePage: handleRotatePage,
    deletePage: handleDeletePage,
    addPage: handleAddPage,
  } = usePageManagement({
    onPdfBytesChange: handlePdfBytesChange,
    onPageCountChange: handlePageCountChange,
    onPageChange: handlePageChangeFromOperation,
  });

  // Update page management hook with current PDF bytes
  useEffect(() => {
    if (pdfBytes) {
      setPageManagementPdfBytes(pdfBytes);
    }
  }, [pdfBytes, setPageManagementPdfBytes]);

  // Page operation handlers
  const onDuplicatePage = useCallback(async (pageIndex) => {
    try {
      await handleDuplicatePage(pageIndex);
    } catch (err) {
      setDialog({
        title: 'Duplicate Failed',
        message: err.message || 'Failed to duplicate the page.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
    }
  }, [handleDuplicatePage, setDialog]);

  const onRotatePage = useCallback(async (pageIndex) => {
    try {
      await handleRotatePage(pageIndex, 90);
      // Track rotation for UI update
      setPageRotations(prev => ({
        ...prev,
        [pageIndex + 1]: ((prev[pageIndex + 1] || 0) + 90) % 360,
      }));
    } catch (err) {
      setDialog({
        title: 'Rotate Failed',
        message: err.message || 'Failed to rotate the page.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
    }
  }, [handleRotatePage, setDialog]);

  const onDeletePage = useCallback(async (pageIndex) => {
    try {
      await handleDeletePage(pageIndex);
    } catch (err) {
      setDialog({
        title: 'Delete Failed',
        message: err.message || 'Failed to delete the page.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
    }
  }, [handleDeletePage, setDialog]);

  const onAddPage = useCallback(async (insertIndex) => {
    try {
      await handleAddPage(insertIndex);
    } catch (err) {
      setDialog({
        title: 'Add Page Failed',
        message: err.message || 'Failed to add a new page.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
    }
  }, [handleAddPage, setDialog]);

  const renderOverlay = (pageNum) => (
    <EditorOverlay
      pageNum={pageNum}
      signatures={signatures}
      annotations={annotations}
      selectedItemId={selectedItemId}
      onStartDrag={startDrag}
      onSelect={setSelectedItemId}
    />
  );

  return (
    <div className="contents">
      <AppDialog
        dialog={dialog}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          if (dialog?.primaryTo) {
            if (dialog.primaryTo === '/pricing' || dialog.primaryTo.startsWith('http')) {
              window.location.assign(dialog.primaryTo);
            } else {
              navigate(dialog.primaryTo);
            }
          }
          setDialog(null);
        }}
      />

      <div className="flex flex-col h-full bg-slate-100">
        <EditorToolbar
          fileName={selectedDocument?.name}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onShare={() => {
            setDialog({
              title: 'Pro required',
              message: 'Upgrade to Pro to share links.',
              primaryLabel: 'Upgrade to Pro',
              primaryTo: '/pricing',
              secondaryLabel: 'Cancel',
              secondaryTo: null,
            });
          }}
          onUpload={() => {
            setDialog({
              title: 'Pro required',
              message: 'Upgrade to Pro to upload to cloud.',
              primaryLabel: 'Upgrade to Pro',
              primaryTo: '/pricing',
              secondaryLabel: 'Cancel',
              secondaryTo: null,
            });
          }}
          onView={() => {
            const overlays = { signatures, annotations };
            if (location.pathname.includes('/edit/test-docs/') && selectedDocument?.name) {
              navigate(`/view/test-docs/${selectedDocument.name}`, { state: { overlays } });
              return;
            }
            navigate('/view', { state: { document: selectedDocument, overlays } });
          }}
          onCancel={() => navigate('/view')}
          onDownload={handleDownloadEditedPdf}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={!!selectedItemId}
          onUndo={undo}
          onRedo={redo}
          onDelete={deleteSelectedItem}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {pdfDoc && (
            <PageThumbnails
              pdfDoc={pdfDoc}
              numPages={numPages}
              currentPage={pageNumber}
              onPageClick={handleThumbnailClick}
              onDuplicatePage={onDuplicatePage}
              onRotatePage={onRotatePage}
              onDeletePage={onDeletePage}
              onAddPage={onAddPage}
              isProcessing={isPageOperationProcessing}
              pageRotations={pageRotations}
            />
          )}

          <div className="flex-1 overflow-auto p-8 flex justify-center relative bg-slate-100/50">
            {pdfDoc ? (
              <div
                className={`w-full flex justify-center ${activeTool !== 'select' ? 'cursor-crosshair' : ''}`}
                style={{ minHeight: '100%' }}
                onClickCapture={handleCanvasClick}
              >
                <PDFDisplay
                  pdfDoc={pdfDoc}
                  numPages={numPages}
                  pageScale={pageScale}
                  isLoading={isPdfLoading}
                  loadingMessage={loadingMessage}
                  onPageVisible={(visiblePageNum) => navigation.setPageNumber(visiblePageNum)}
                  renderPageOverlay={renderOverlay}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full">
                <PDFDropzone onFileSelect={handleFileUpload} />
              </div>
            )}
          </div>

          <PDFControls
            onFileSelect={handleFileUpload}
            onEdit={() => {}}
            pageNumber={pageNumber}
            numPages={numPages}
            pageScale={pageScale}
            onPreviousPage={navigation.goToPreviousPage}
            onNextPage={navigation.goToNextPage}
            onZoomIn={navigation.zoomIn}
            onZoomOut={navigation.zoomOut}
            fileInputRef={fileInputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
