import React, { useEffect, useState, useRef, Suspense, lazy, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getFunctions } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import PDFControls from './PDFControls';
import PDFDropzone from './PDFDropzone';

// Dynamically loaded engines
const PDFDisplay = lazy(() => import('./PDFDisplay'));
const DocxViewer = lazy(() => import('./DocxViewer'));

import PageThumbnails from './PageThumbnails';
import AnalysisSidebar from './AnalysisSidebar';
import SignatureModal from './SignatureModal';
import DocumentTypeSelector from './DocumentTypeSelector';
import AppDialog from './ui/AppDialog.jsx';
import ViewerToolbar from './ViewerToolbar';
import ViewerPageOverlay from './viewer/ViewerPageOverlay.jsx';
import { useDocumentTypes } from '../hooks/useDocumentTypes';
import { useValidationSpec } from '../hooks/useValidationSpec';
import { usePdfJs } from '../hooks/usePdfJs';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useDocumentTypeDetection } from '../hooks/useDocumentTypeDetection';
import { useTextSelection } from '../hooks/useTextSelection';
import { useViewerSignMode } from '../hooks/useViewerSignMode';
import { useViewerDocumentState } from '../hooks/useViewerDocumentState';
import { useOverlayHotkeys } from '../hooks/useOverlayHotkeys.js';
import { usePageManagement } from '../hooks/usePageManagement.js';

const DocumentViewer = () => {
  const { authState, app } = useAuth();
  const isMockMode = typeof window !== 'undefined' && window.MOCK_AUTH;

  const { fileName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const lastAutoAnalysisRunKeyRef = useRef(null);

  // Initialize Firebase functions
  const functions = app ? getFunctions(app) : null;

  // New Hooks
  const {
    pdfLibLoaded,
    pdfDoc,
    docxBlob,
    docType,
    numPages,
    pageNumber,
    pageScale,
    pdfTextContent,
    docHash,
    isLoading: isPdfLoading,
    loadingMessage,
    loadPdfFromBlob,
    loadTestPdf,
    navigation,
    loadError,
    resetPdf,
  } = usePdfJs();

  const {
    analysisResults,
    gate,
    dialog,
    setGate,
    setDialog,
    isLoading: isAnalysisLoading,
    handleAnalyzeDocument,
    handleAnalyzeByType,
    handleExplainSelection,
    handleHighlightRisks,
    handleTranslateToPlainEnglish,
    handleSummarizeKeyPoints,
    handleSuggestImprovements,
  } = useDocumentAnalysis({ functions, authState, isMockMode });

  const textSelection = useTextSelection();

  const {
    detectedDocTypeId,
    overrideDocTypeId,
    pendingOverride,
    setOverrideDocTypeId,
    setPendingOverride,
    loadServerTypeState,
    runServerDetection,
    persistOverride,
    loadLocalOverride,
  } = useDocumentTypeDetection({ functions, isMockMode });

  const {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    signatureModalOpen,
    setSignatureModalOpen,
    selectedItemId,
    setSelectedItemId,
    handleCanvasClick,
    handleSignClick,
    handleSignatureAdopt,
    startDrag,
    deleteSelectedItem,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useViewerSignMode({
    initialSignatures: location.state?.overlays?.signatures,
    initialAnnotations: location.state?.overlays?.annotations,
  });

  const [highlights] = useState([]);
  const [clauseMarkers] = useState([]);
  const [riskBadges, setRiskBadges] = useState([]);
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    selectedDocument,
    isCloudBusy,
    handleFileUpload,
    handleSaveToCloud,
    handleDownload,
    handleEditDocument,
    handleFinishDocument,
  } = useViewerDocumentState({
    fileName,
    pdfLibLoaded,
    location,
    navigate,
    loadTestPdf,
    loadPdfFromBlob,
    loadError,
    setDialog,
    loadLocalOverride,
    loadServerTypeState,
    runServerDetection,
    functions,
    pdfDoc,
    resetPdf,
  });
  
  // Page management state
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pageRotations, setPageRotations] = useState({});
  const pdfBytesRef = useRef(null);
  
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
    scrollToPage(newPage);
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

  useOverlayHotkeys({
    enabled: true,
    canUndo,
    canRedo,
    hasSelection: !!selectedItemId,
    onUndo: undo,
    onRedo: redo,
    onDelete: deleteSelectedItem,
  });

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
  }, [setDialog]);

  const handleDownloadWithOverlays = () =>
    handleDownload({ signatures, annotations, pageScale });

  const handleEditWithOverlays = () =>
    handleEditDocument({ overlays: { signatures, annotations } });

  // Derived State
  const isPdfBusy = isPdfLoading;
  const isAnalysisBusy = isAnalysisLoading;
  const { types: documentTypes } = useDocumentTypes();
  const resolveType = (id) => documentTypes.find((t) => t.id === id) || null;
  const effectiveDocTypeId = overrideDocTypeId || detectedDocTypeId;
  const effectiveDocType = resolveType(effectiveDocTypeId);
  const detectedDocType = resolveType(detectedDocTypeId);
  const validationSlug = effectiveDocType?.validationSlug || null;
  useValidationSpec(validationSlug);


  // PDF Rendering Logic is now handled within PDFDisplay -> PDFPage
  const handlePageVisible = (pageNum) => {
    navigation.setPageNumber(pageNum);
  };

  const scrollToPage = (pageNum) => {
    navigation.setPageNumber(pageNum);
    const element = document.getElementById(`pdf-page-${pageNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    const target = Math.max((pageNumber || 1) - 1, 1);
    scrollToPage(target);
  };

  const handleNextPage = () => {
    const target = Math.min((pageNumber || 1) + 1, numPages || 1);
    scrollToPage(target);
  };

  const updateAnnotationsFromAnalysis = (analysis) => {
    const newRiskBadges = [];
    if (analysis.risks && analysis.risks.length > 0) {
      analysis.risks.forEach((risk, index) => {
        newRiskBadges.push({
          id: index,
          pageNum: 1,
          x: 100 + index * 50,
          y: 100 + index * 40,
          level: risk.riskLevel,
          description: risk.description,
          explanation: risk.explanation,
        });
      });
    }
    setRiskBadges(newRiskBadges);
  };

  // Auto-run basic analysis immediately when a document is opened.
  // If the backend has a cached analysis for this docHash, it will be served instantly.
  useEffect(() => {
    if (!selectedDocument || !docHash || !numPages) return;
    if (!pdfTextContent && !isMockMode) return;
    if (authState.status !== 'authenticated') return;
    if (isAnalysisBusy) return;

    const runKey = `${selectedDocument.id}:${docHash}`;
    if (lastAutoAnalysisRunKeyRef.current === runKey) return;

    const existing = analysisResults?.[selectedDocument.id];
    if (existing?._meta?.status === 'success') {
      lastAutoAnalysisRunKeyRef.current = runKey;
      return;
    }

    lastAutoAnalysisRunKeyRef.current = runKey;
    handleAnalyzeDocument({
      selectedDocument,
      pdfTextContent,
      docHash,
      numPages,
      updateAnnotations: updateAnnotationsFromAnalysis,
    });
  }, [
    authState.status,
    docHash,
    numPages,
    pdfTextContent,
    selectedDocument,
    analysisResults,
    handleAnalyzeDocument,
    isAnalysisBusy,
    isMockMode,
  ]);

  useEffect(() => {
    if (!selectedDocument || !docHash) {
      lastAutoAnalysisRunKeyRef.current = null;
    }
  }, [selectedDocument, docHash]);

  const renderPageOverlay = (pageNum) => (
    <ViewerPageOverlay
      pageNum={pageNum}
      signatures={signatures}
      annotations={annotations}
      selectedItemId={selectedItemId}
      onStartDrag={startDrag}
      onSelect={setSelectedItemId}
    />
  );

  const activeDialog = gate || dialog;

  return (
    <div className="contents">
      {/* Signature Creation Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onAdopt={handleSignatureAdopt}
      />

      {/* App Dialog */}
      <AppDialog
        dialog={activeDialog}
        onCancel={() => {
          setGate(null);
          setDialog(null);
        }}
        onConfirm={async () => {
          if (activeDialog?._kind === 'confirm-override' && pendingOverride && docHash) {
            const typeId = pendingOverride.id;
            setOverrideDocTypeId(typeId);
            await persistOverride(docHash, typeId);
            setPendingOverride(null);
            setDialog(null);
            return;
          }

          setGate(null);
          setDialog(null);
          if (activeDialog?.primaryTo) navigate(activeDialog.primaryTo);
        }}
      />

      {/* Document Type Selector Modal */}
      <DocumentTypeSelector
        open={typeSelectorOpen}
        detectedType={detectedDocType}
        onClose={() => setTypeSelectorOpen(false)}
        onPick={(t) => {
          setTypeSelectorOpen(false);
          setPendingOverride(t);
          setDialog({
            title: 'Confirm document type',
            message: `Set document type to “${t.label}”? This will change the actions/checks we show for this document.`,
            primaryLabel: 'Confirm',
            primaryTo: null,
            secondaryLabel: 'Cancel',
            secondaryTo: null,
            _kind: 'confirm-override',
          });
        }}
      />

      <div id="viewer-root" className="flex flex-col flex-1 h-full overflow-hidden bg-slate-100">

        {/* ─── Top Bar: Filename + Actions + Doc Type + Tools ─── */}
        {(pdfDoc || docxBlob) && (
          <ViewerToolbar
            fileName={selectedDocument?.name}
            onShare={() => {
              if (!selectedDocument) return;
              navigate('/sign', { state: { document: selectedDocument } });
            }}
            onSaveCloud={handleSaveToCloud}
            onDownload={handleDownloadWithOverlays}
            onEdit={handleEditWithOverlays}
            onFinish={handleFinishDocument}
            isCloudBusy={isCloudBusy}
            effectiveDocType={effectiveDocType}
            onOpenDocTypeSelector={() => setTypeSelectorOpen(true)}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onSignClick={handleSignClick}
            canUndo={canUndo}
            canRedo={canRedo}
            hasSelection={!!selectedItemId}
            onUndo={undo}
            onRedo={redo}
            onDelete={deleteSelectedItem}
          />
        )}

        {/* ─── Main Content Area ─── */}
        <div id="viewer-content" className="flex flex-1 overflow-hidden relative">

          {/* Canvas Area */}
          <div id="viewer-canvas-area" className="flex-1 flex flex-col items-center justify-start overflow-hidden relative">

            {(pdfDoc || docxBlob) ? (
              <div className="w-full flex-1 relative flex overflow-hidden">
                {/* Left Thumbnails (PDF only for now) */}
                {pdfDoc && (
                  <PageThumbnails
                    pdfDoc={pdfDoc}
                    numPages={numPages}
                    currentPage={pageNumber}
                    onPageClick={scrollToPage}
                    onDuplicatePage={onDuplicatePage}
                    onRotatePage={onRotatePage}
                    onDeletePage={onDeletePage}
                    onAddPage={onAddPage}
                    isProcessing={isPageOperationProcessing}
                    pageRotations={pageRotations}
                  />
                )}

                {/* Center Scrollable Content */}
                <div
                  id="viewer-scroll-area"
                  className={`flex-1 overflow-auto bg-slate-100/50 relative ${activeTool !== 'select' ? 'cursor-crosshair' : ''}`}
                  onClickCapture={handleCanvasClick}
                >
                  <Suspense fallback={
                    <div className="flex-1 flex flex-col h-full items-center justify-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-2"></div>
                      <p>Loading rendering engine...</p>
                    </div>
                  }>
                    {docType === 'docx' && docxBlob ? (
                        <DocxViewer blob={docxBlob} scale={pageScale} />
                    ) : pdfDoc ? (
                        <PDFDisplay
                          pdfDoc={pdfDoc}
                          numPages={numPages}
                          pageScale={pageScale}
                          isLoading={isPdfBusy}
                          loadingMessage={loadingMessage}
                          onPageVisible={handlePageVisible}
                          highlights={highlights}
                          clauseMarkers={clauseMarkers}
                          riskBadges={riskBadges}
                          renderPageOverlay={renderPageOverlay}
                        />
                    ) : null}
                  </Suspense>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full">
                <PDFDropzone onFileSelect={handleFileUpload} />
              </div>
            )}

            {/* Floating Page Controls */}
            {(pdfDoc || docxBlob) && (
              <PDFControls
                onFileSelect={handleFileUpload}
                onEdit={handleEditWithOverlays}
                pageNumber={pageNumber}
                numPages={numPages}
                pageScale={pageScale}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                onZoomIn={navigation.zoomIn}
                onZoomOut={navigation.zoomOut}
                fileInputRef={fileInputRef}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <AnalysisSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onAnalyzeDocument={() => handleAnalyzeDocument({ selectedDocument, pdfTextContent, docHash, numPages, updateAnnotations: updateAnnotationsFromAnalysis })}
            onAnalyzeByType={() => handleAnalyzeByType({ selectedDocument, pdfTextContent, docHash })}
            onExplainSelection={() => handleExplainSelection({ selectedDocument, docHash, pdfTextContent, selection: textSelection })}
            onHighlightRisks={() => handleHighlightRisks({ selectedDocument, docHash, pdfTextContent, setRiskBadges })}
            onTranslateToPlainEnglish={() => handleTranslateToPlainEnglish({ selectedDocument, docHash, pdfTextContent })}
            onSummarizeKeyPoints={() => handleSummarizeKeyPoints({ selectedDocument, docHash, pdfTextContent })}
            onSuggestImprovements={() => handleSuggestImprovements({ selectedDocument, docHash, pdfTextContent })}
            isLoading={isAnalysisBusy}
            isAuthenticated={authState.status === 'authenticated'}
            hasDocument={!!selectedDocument}
            selectedDocument={selectedDocument}
            analysisResults={analysisResults}
            textSelection={textSelection}
          />
        </div>
      </div>
    </div>
  );
};

// ViewerToolButton was extracted to ViewerToolbar.jsx
export default DocumentViewer;
