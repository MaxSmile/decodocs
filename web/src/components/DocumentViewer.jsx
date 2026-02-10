import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getFunctions } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import PDFControls from './PDFControls';
import PDFDisplay from './PDFDisplay';
import PDFDropzone from './PDFDropzone';
import PageThumbnails from './PageThumbnails';
import AnalysisSidebar from './AnalysisSidebar';
import DocumentTypeSelector from './DocumentTypeSelector';
import { useDocumentTypes } from '../hooks/useDocumentTypes';
import { useValidationSpec } from '../hooks/useValidationSpec';
// import { usePDFRenderer } from '../hooks/usePDFRenderer'; // Now used inside PDFPage
import { usePdfJs } from '../hooks/usePdfJs';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useDocumentTypeDetection } from '../hooks/useDocumentTypeDetection';

const DocumentViewer = () => {
  const { authState, app } = useAuth();
  const isMockMode = typeof window !== 'undefined' && window.MOCK_AUTH;

  const { documentId, fileName } = useParams();
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
    docStats,
    docHash,
    isLoading: isPdfLoading,
    loadingMessage,
    loadPdfFromBlob,
    loadTestPdf,
    navigation,
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
  } = useDocumentAnalysis({ functions, authState, isMockMode });

  const {
    detectedDocTypeId,
    detectedMeta,
    overrideDocTypeId,
    pendingOverride,
    setOverrideDocTypeId,
    setPendingOverride,
    loadServerTypeState,
    runServerDetection,
    persistOverride,
    loadLocalOverride,
  } = useDocumentTypeDetection({ functions, isMockMode });

  // Local UI State
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [clauseMarkers, setClauseMarkers] = useState([]);
  const [riskBadges, setRiskBadges] = useState([]);
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar open by default

  // Derived State
  const isLoading = isPdfLoading || isAnalysisLoading;
  const { types: documentTypes } = useDocumentTypes();
  const resolveType = (id) => documentTypes.find((t) => t.id === id) || null;
  const effectiveDocTypeId = overrideDocTypeId || detectedDocTypeId;
  const effectiveDocType = resolveType(effectiveDocTypeId);
  const detectedDocType = resolveType(detectedDocTypeId);
  const validationSlug = effectiveDocType?.validationSlug || null;
  const validation = useValidationSpec(validationSlug);


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


  // Effect: Load Test PDF (from URL param)
  useEffect(() => {
    if (fileName && pdfLibLoaded) {
      const load = async () => {
        try {
          const result = await loadTestPdf(fileName);
          if (result) {
            setSelectedDocument({
              id: fileName,
              name: fileName,
              type: 'application/pdf',
              size: result.fileInfo?.size,
              file: null
            });
            loadLocalOverride(result.docHash);
            await loadServerTypeState(result.docHash);
            runServerDetection({ docHashValue: result.docHash, stats: result.stats, text: result.text });
          }
        } catch (err) {
          setGate({
            title: 'Could not load PDF',
            message: err?.message || 'Failed to load test PDF.',
            primaryLabel: 'OK',
            primaryTo: null,
            secondaryLabel: null,
            secondaryTo: null,
          });
        }
      };
      load();
    }
  }, [fileName, pdfLibLoaded]);

  // Effect: Load PDF from Navigation State
  useEffect(() => {
    if (location.state?.document && !fileName && pdfLibLoaded) {
      const doc = location.state.document;
      setSelectedDocument(doc);

      const load = async () => {
        try {
          const result = await loadPdfFromBlob(doc.file);
          if (result) {
            loadLocalOverride(result.docHash);
            await loadServerTypeState(result.docHash);
            runServerDetection({ docHashValue: result.docHash, stats: result.stats, text: result.text });
          }
        } catch (e) {
          // ignore, handled in hook
        }
      };
      load();
    }
  }, [location, fileName, pdfLibLoaded]);

  // Handlers
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length > 0) {
      const file = pdfFiles[0];
      const newDocument = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      };

      setSelectedDocument(newDocument);
      navigate('/view', { state: { document: newDocument } });
    }
  };

  const handleEditDocument = () => {
    if (selectedDocument) {
      navigate(`/edit/${selectedDocument.id}`, { state: { document: selectedDocument } });
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

  return (
    <Layout variant="app" showFooter={false}>
      {gate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-[2000] p-4"
          onClick={() => setGate(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 max-w-[520px] w-full p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-black text-base text-slate-900">{gate.title}</div>
            <div className="mt-2.5 text-slate-600 leading-relaxed whitespace-pre-wrap">{gate.message}</div>
            <div className="mt-3.5 flex gap-2.5 flex-wrap justify-end">
              {gate.secondaryLabel && (
                <button
                  type="button"
                  onClick={() => {
                    setGate(null);
                    if (gate.secondaryTo) navigate(gate.secondaryTo);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-black cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  {gate.secondaryLabel}
                </button>
              )}
              {gate.primaryLabel && (
                <button
                  type="button"
                  onClick={async () => {
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
                  className="px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900 text-white font-black cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  {gate.primaryLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      <div className="flex flex-1 h-full overflow-hidden relative bg-slate-100">

        {/* Main Canvas Area */}
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-hidden relative">

          {/* Document Type Chip (Floating Top Left) */}
          {docHash && (
            <div className="absolute top-4 left-4 z-10 hidden lg:flex gap-2 items-center px-3 py-2 rounded-lg bg-white/90 backdrop-blur shadow-sm border border-slate-200/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</span>
              <span className="text-sm font-semibold text-slate-700">{effectiveDocType?.label || 'Unknown'}</span>
              <button onClick={() => setTypeSelectorOpen(true)} className="text-xs text-blue-600 font-medium hover:underline ml-1">Change</button>
            </div>
          )}

          {/* PDF Canvas area with Dropzone or Content */}
          {pdfDoc ? (
            <div className="w-full flex-1 relative flex">
              {/* Left Thumbnails */}
              <PageThumbnails
                pdfDoc={pdfDoc}
                numPages={numPages}
                currentPage={pageNumber}
                onPageClick={scrollToPage}
              />

              {/* Center Scrollable Content */}
              <div className="flex-1 overflow-auto bg-slate-100/50 relative">
                <PDFDisplay
                  pdfDoc={pdfDoc}
                  numPages={numPages}
                  pageScale={pageScale}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onPageVisible={handlePageVisible}
                  highlights={highlights}
                  clauseMarkers={clauseMarkers}
                  riskBadges={riskBadges}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center w-full">
              <PDFDropzone onFileSelect={handleFileUpload} />
            </div>
          )}

          {/* Floating Controls */}
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
          onExplainSelection={() => handleExplainSelection({ selectedDocument, docHash, pdfTextContent })}
          onHighlightRisks={() => handleHighlightRisks({ selectedDocument, docHash, pdfTextContent, setRiskBadges })}
          onTranslateToPlainEnglish={() => handleTranslateToPlainEnglish({ selectedDocument, docHash, pdfTextContent })}
          isLoading={isLoading}
          isAuthenticated={authState.status === 'authenticated'}
          hasDocument={!!selectedDocument}
          selectedDocument={selectedDocument}
          analysisResults={analysisResults}
        />

      </div>
    </Layout>
  );
};

export default DocumentViewer;
