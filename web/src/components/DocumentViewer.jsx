import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getFunctions } from 'firebase/functions';
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
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import PDFControls from './PDFControls';
import PDFDisplay from './PDFDisplay';
import PDFDropzone from './PDFDropzone';
import PageThumbnails from './PageThumbnails';
import AnalysisSidebar from './AnalysisSidebar';
import SignatureModal from './SignatureModal';
import DocumentTypeSelector from './DocumentTypeSelector';
import { useDocumentTypes } from '../hooks/useDocumentTypes';
import { useValidationSpec } from '../hooks/useValidationSpec';
import { usePdfJs } from '../hooks/usePdfJs';
import { useDocumentAnalysis } from '../hooks/useDocumentAnalysis';
import { useDocumentTypeDetection } from '../hooks/useDocumentTypeDetection';
import { useTextSelection } from '../hooks/useTextSelection';
import {
  createUploadUrl,
  createDownloadUrl,
  uploadViaPresignedUrl,
  downloadBlobViaPresignedUrl,
} from '../services/storageService';
import { openPdfOrEnvelopeFile } from '../services/envelopeService';

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
    handleSummarizeKeyPoints,
    handleSuggestImprovements,
  } = useDocumentAnalysis({ functions, authState, isMockMode });

  const textSelection = useTextSelection();

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState('select');
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState(null); // holds adopted sig data until placed
  const [cloudObjectKey, setCloudObjectKey] = useState(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);

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
      setCloudObjectKey(doc?.cloudKey || null);

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
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const file = files[0];
      const opened = await openPdfOrEnvelopeFile(file);
      const newDocument = {
        id: Date.now() + Math.random(),
        name: opened.pdfFile.name,
        size: opened.pdfFile.size,
        type: opened.pdfFile.type,
        file: opened.pdfFile,
        sourceType: opened.source,
        envelope: opened.envelope || null,
      };

      setSelectedDocument(newDocument);
      setCloudObjectKey(null);
      navigate('/view', { state: { document: newDocument } });
    } catch (err) {
      setGate({
        title: 'Unsupported or invalid file',
        message: err?.message || 'Please upload a valid .pdf or .snapsign file.',
        primaryLabel: 'OK',
      });
    }
  };

  const sanitizeFileName = (name) =>
    String(name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');

  const handleSaveToCloud = async () => {
    if (!functions) return;
    if (!selectedDocument?.file) {
      setGate({
        title: 'No local file to upload',
        message: 'Open a local PDF first, then save it to DecoDocs cloud storage.',
        primaryLabel: 'OK',
      });
      return;
    }

    setIsCloudBusy(true);
    try {
      const keySeed = `documents/${Date.now()}-${sanitizeFileName(selectedDocument.name)}`;
      const uploadInfo = await createUploadUrl(functions, {
        key: keySeed,
        contentType: selectedDocument.type || 'application/pdf',
        expiresIn: 600,
      });

      await uploadViaPresignedUrl({
        url: uploadInfo.url,
        file: selectedDocument.file,
        contentType: selectedDocument.type || 'application/pdf',
      });

      setCloudObjectKey(uploadInfo.key);
      setSelectedDocument((prev) => ({ ...(prev || {}), cloudKey: uploadInfo.key }));
      setGate({
        title: 'Saved to DecoDocs',
        message: `Document uploaded successfully.\nObject key: ${uploadInfo.key}`,
        primaryLabel: 'OK',
      });
    } catch (err) {
      const code = err?.code || '';
      const isProGate = String(code).includes('permission-denied');
      setGate({
        title: isProGate ? 'Pro required' : 'Cloud upload failed',
        message: isProGate
          ? 'Cloud storage is available for Pro plans. Upgrade to continue.'
          : (err?.message || 'Unable to upload file to cloud storage.'),
        primaryLabel: isProGate ? 'View plans' : 'OK',
        primaryTo: isProGate ? '/pricing' : null,
      });
    } finally {
      setIsCloudBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfDoc) return;

    // Prefer original in-memory file when available.
    if (selectedDocument?.file) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(selectedDocument.file);
      link.download = selectedDocument?.name || 'document.pdf';
      link.click();
      return;
    }

    // Fallback: cloud object download via callable + pre-signed URL.
    if (functions && cloudObjectKey) {
      setIsCloudBusy(true);
      try {
        const downloadInfo = await createDownloadUrl(functions, {
          key: cloudObjectKey,
          expiresIn: 600,
        });
        const blob = await downloadBlobViaPresignedUrl(downloadInfo.url);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = selectedDocument?.name || 'document.pdf';
        link.click();
        return;
      } catch (err) {
        setGate({
          title: 'Download failed',
          message: err?.message || 'Unable to download cloud document.',
          primaryLabel: 'OK',
        });
      } finally {
        setIsCloudBusy(false);
      }
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

  // Signing tool: place annotation on canvas click
  const handleCanvasClick = (e) => {
    if (activeTool === 'select') return;

    const pageWrapper = e.target.closest('[data-page-num]');
    if (!pageWrapper) return;

    const pageNum = parseInt(pageWrapper.getAttribute('data-page-num'), 10);
    const rect = pageWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'signature' && pendingSignature) {
      setSignatures((prev) => [
        ...prev,
        {
          id: Date.now(),
          pageNum,
          x,
          y,
          width: pendingSignature.width || 200,
          height: pendingSignature.height || 60,
          ...pendingSignature,
        },
      ]);
      setActiveTool('select');
      // Don't clear pendingSignature so user can place the same sig again with another Sign click
    } else if (activeTool === 'text') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: 'Text', type: 'text' }]);
      setActiveTool('select');
    } else if (activeTool === 'date') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: new Date().toLocaleDateString(), type: 'date' }]);
      setActiveTool('select');
    } else if (activeTool === 'image') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: '🖼 Image', type: 'image' }]);
      setActiveTool('select');
    } else if (activeTool === 'checkmark') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: '✓', type: 'checkmark' }]);
      setActiveTool('select');
    }
  };

  // Render signing overlays on each page
  const renderPageOverlay = (pageNum) => (
    <>
      {signatures.filter((s) => s.pageNum === pageNum).map((sig) => (
        <div
          key={sig.id}
          className="absolute border-2 border-blue-500/40 bg-blue-50/20 flex items-center justify-center cursor-move rounded"
          style={{ left: sig.x, top: sig.y, width: sig.width, height: sig.height, zIndex: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {sig.mode === 'type' ? (
            <span
              className="text-slate-900 select-none"
              style={{ fontFamily: sig.fontFamily, fontSize: '1.5rem', lineHeight: 1 }}
            >
              {sig.text}
            </span>
          ) : sig.dataUrl ? (
            <img src={sig.dataUrl} alt="Signature" className="max-w-full max-h-full object-contain" draggable={false} />
          ) : (
            <span className="text-blue-700 font-semibold italic text-lg">Signature</span>
          )}
        </div>
      ))}
      {annotations.filter((a) => a.pageNum === pageNum).map((ann) => (
        <div
          key={ann.id}
          className={`absolute px-2 py-1 text-sm shadow-sm cursor-move rounded ${ann.type === 'checkmark'
              ? 'text-green-700 text-2xl font-bold'
              : ann.type === 'date'
                ? 'bg-amber-50 border border-amber-300 text-amber-800'
                : ann.type === 'image'
                  ? 'bg-purple-50 border border-purple-300 text-purple-700'
                  : 'bg-yellow-100 border border-yellow-300 text-slate-800'
            }`}
          style={{ left: ann.x, top: ann.y, zIndex: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {ann.text}
        </div>
      ))}
    </>
  );

  return (
    <Layout variant="app" showFooter={false}>
      {/* Signature Creation Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onAdopt={(sigData) => {
          setPendingSignature(sigData);
          setActiveTool('signature');
        }}
      />

      {/* Gate Dialog */}
      {gate && (
        <div
          id="viewer-gate-dialog"
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
          <div id="viewer-toolbar" className="flex flex-col bg-white border-b border-slate-200 z-20 relative">

            {/* Row 1: Filename + icons (left) | Download + Finish (right) */}
            <div id="viewer-filename-bar" className="h-11 px-4 flex items-center justify-between border-b border-slate-100/80">
              <div className="flex items-center gap-3 min-w-0">
                <span id="viewer-filename" className="font-semibold text-slate-800 text-sm truncate max-w-[320px]">
                  {selectedDocument?.name || 'Untitled Document'}
                </span>

                {/* Delicate icon-only action buttons */}
                <div id="viewer-quick-actions" className="flex items-center gap-0.5 ml-1">
                  <button
                    id="btn-share-link"
                    onClick={() => {
                      if (!selectedDocument) return;
                      navigate('/sign', { state: { document: selectedDocument } });
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Send for signature"
                  >
                    <HiLink className="w-4 h-4" />
                  </button>
                  <button
                    id="btn-save-decodocs"
                    onClick={handleSaveToCloud}
                    className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isCloudBusy ? 'Working...' : 'Save to DecoDocs'}
                    disabled={isCloudBusy}
                  >
                    <HiCloudUpload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Download + Finish */}
              <div id="viewer-primary-actions" className="flex items-center gap-2">
                <button
                  id="btn-download"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCloudBusy}
                >
                  <HiDownload className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  id="btn-finish"
                  onClick={() => {
                    setSelectedDocument(null);
                    navigate('/view');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Finish
                  <HiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Row 2: Doc type chip (left) + Signing tools (center) */}
            <div id="viewer-tools-bar" className="h-10 px-4 flex items-center bg-slate-50/60">
              {/* Doc type chip */}
              <div id="viewer-doctype-bar" className="flex items-center">
                <button
                  id="viewer-doctype-chip"
                  onClick={() => setTypeSelectorOpen(true)}
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

              {/* Signing & annotation tools */}
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
                  onClick={() => {
                    if (pendingSignature) {
                      // Already have a signature adopted, just activate placement
                      setActiveTool('signature');
                    } else {
                      setSignatureModalOpen(true);
                    }
                  }}
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
                    isLoading={isLoading}
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
            isLoading={isLoading}
            isAuthenticated={authState.status === 'authenticated'}
            hasDocument={!!selectedDocument}
            selectedDocument={selectedDocument}
            analysisResults={analysisResults}
            textSelection={textSelection}
          />
        </div>
      </div>
    </Layout>
  );
};

/* ─── Signing toolbar button (compact, delicate) ─── */
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

export default DocumentViewer;
