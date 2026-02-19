import React, { useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getFunctions } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import PDFControls from './PDFControls';
import PDFDisplay from './PDFDisplay';
import PDFDropzone from './PDFDropzone';
import PageThumbnails from './PageThumbnails';
import AnalysisSidebar from './AnalysisSidebar';
import SignatureModal from './SignatureModal';
import DocumentTypeSelector from './DocumentTypeSelector';
import GateDialog from './GateDialog';
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

const DocumentViewer = () => {
  const { authState, app } = useAuth();
  const isMockMode = typeof window !== 'undefined' && window.MOCK_AUTH;

  const { fileName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Initialize Firebase functions
  const functions = app ? getFunctions(app) : null;

  // New Hooks
  const {
    pdfLibLoaded,
    pdfDoc,
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
    setGate,
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
    handleCanvasClick,
    handleSignClick,
    handleSignatureAdopt,
  } = useViewerSignMode();

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
    setGate,
    loadLocalOverride,
    loadServerTypeState,
    runServerDetection,
    functions,
    pdfDoc,
    resetPdf,
  });

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

  const renderPageOverlay = (pageNum) => (
    <ViewerPageOverlay pageNum={pageNum} signatures={signatures} annotations={annotations} />
  );

  return (
    <div className="contents">
      {/* Signature Creation Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onAdopt={handleSignatureAdopt}
      />

      {/* Gate Dialog */}
      <GateDialog
        gate={gate}
        onCancel={() => setGate(null)}
        onConfirm={async () => {
          if (gate._kind === 'confirm-override' && pendingOverride && docHash) {
            const typeId = pendingOverride.id;
            setOverrideDocTypeId(typeId);
            await persistOverride(docHash, typeId);
            setPendingOverride(null);
            setGate(null);
            return;
          }

          setGate(null);
          if (gate.primaryTo) navigate(gate.primaryTo);
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
          setGate({
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
        {pdfDoc && (
          <ViewerToolbar
            fileName={selectedDocument?.name}
            onShare={() => {
              if (!selectedDocument) return;
              navigate('/sign', { state: { document: selectedDocument } });
            }}
            onSaveCloud={handleSaveToCloud}
            onDownload={handleDownload}
            onFinish={handleFinishDocument}
            isCloudBusy={isCloudBusy}
            effectiveDocType={effectiveDocType}
            onOpenDocTypeSelector={() => setTypeSelectorOpen(true)}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onSignClick={handleSignClick}
          />
        )}

        {/* ─── Main Content Area ─── */}
        <div id="viewer-content" className="flex flex-1 overflow-hidden relative">

          {/* PDF Canvas Area */}
          <div id="viewer-canvas-area" className="flex-1 flex flex-col items-center justify-start overflow-hidden relative">

            {pdfDoc ? (
              <div className="w-full flex-1 relative flex overflow-hidden">
                {/* Left Thumbnails */}
                <PageThumbnails
                  pdfDoc={pdfDoc}
                  numPages={numPages}
                  currentPage={pageNumber}
                  onPageClick={scrollToPage}
                />

                {/* Center Scrollable Content */}
                <div
                  id="viewer-scroll-area"
                  className={`flex-1 overflow-auto bg-slate-100/50 relative ${activeTool !== 'select' ? 'cursor-crosshair' : ''}`}
                  onClick={handleCanvasClick}
                >
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
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full">
                <PDFDropzone onFileSelect={handleFileUpload} />
              </div>
            )}

            {/* Floating Page Controls */}
            {pdfDoc && (
              <PDFControls
                onFileSelect={handleFileUpload}
                onEdit={handleEditDocument}
                pageNumber={pageNumber}
                numPages={numPages}
                pageScale={pageScale}
                onPreviousPage={navigation.goToPreviousPage}
                onNextPage={navigation.goToNextPage}
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
