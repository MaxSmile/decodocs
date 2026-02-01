import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getIdToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { analyzeByTypeCall } from '../services/typeAnalysisService.js';
import { detectDocumentTypeCall, getDocumentTypeStateCall, saveDocTypeOverrideCall } from '../services/documentTypeService.js';
import { preflightCheckCall } from '../services/preflightService.js';
import { analyzeTextCall } from '../services/analyzeTextService.js';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from './Layout.jsx';
import PDFControls from './PDFControls.jsx';
import PDFDisplay from './PDFDisplay.jsx';
import AnalysisToolbox from './AnalysisToolbox.jsx';
import AnalysisResults from './AnalysisResults.jsx';
import DocumentTypeSelector from './DocumentTypeSelector.jsx';
import { useDocumentTypes } from '../hooks/useDocumentTypes.js';
import { useValidationSpec } from '../hooks/useValidationSpec.js';
import { usePDFRenderer } from '../hooks/usePDFRenderer.js';
import { computeSHA256, extractPdfTextAllPages } from '../utils/pdfUtils.js';
import { buildDocStats } from '../utils/docStats.js';

// Use local worker from public folder to ensure stability in tests and offline

const DocumentViewer = () => {
  const { authState, app, auth } = useAuth();
  const isMockMode = typeof window !== 'undefined' && window.MOCK_AUTH;
  const [firebaseError, setFirebaseError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageScale, setPageScale] = useState(1.5);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [pdfTextContent, setPdfTextContent] = useState('');
  const [docStats, setDocStats] = useState(null); // { pageCount, charsPerPage, totalChars }
  const [highlights, setHighlights] = useState([]);
  const [clauseMarkers, setClauseMarkers] = useState([]);
  const [riskBadges, setRiskBadges] = useState([]);
  const [docHash, setDocHash] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [gate, setGate] = useState(null); // { title, message, primaryLabel, primaryTo, secondaryLabel, secondaryTo }
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [detectedDocTypeId, setDetectedDocTypeId] = useState('legal_contract_generic');
  const [detectedMeta, setDetectedMeta] = useState(null); // { intakeCategory, confidence, model, updatedAt }
  const [overrideDocTypeId, setOverrideDocTypeId] = useState(null);
  const [pendingOverride, setPendingOverride] = useState(null);
  const fileInputRef = useRef(null);
  const { documentId, fileName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize Firebase functions reference
  const functions = app ? getFunctions(app) : null;

  // Use PDF renderer hook
  const { canvasRef, textLayerRef, annotationsRef, renderPage: renderPageWithHook } = usePDFRenderer(
    pdfDoc,
    pageScale
  );

  // Check for Firebase errors and set appropriate state
  useEffect(() => {
    if (authState.status === 'error' && authState.error) {
      setFirebaseError(authState.error.message || 'Firebase authentication error');
    } else if (!app) {
      setFirebaseError('Firebase not initialized properly');
    }
  }, [authState, app]);

  // Function to check if Firebase functions are available
  const isFirebaseAvailable = () => {
    // In mock mode, if authenticated, allow operations to proceed
    if (isMockMode && authState.status === 'authenticated') {
      return true;
    }
    return app && functions && authState.status === 'authenticated';
  };

  // Initialize PDF.js
  // NOTE: Worker is configured in utils/pdfUtils.js via GlobalWorkerOptions.workerPort
  // as a module Worker to avoid "Unexpected token 'export'".
  useEffect(() => {
    const initPdfJs = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      window.pdfjsLib = pdfjsLib;
      setPdfLibLoaded(true);

      // If fileName is provided in the route, load the test PDF
      if (fileName) {
        await loadTestPdf(fileName);
      }
    };

    initPdfJs();
  }, [fileName]);

  // Get document from location state
  useEffect(() => {
    if (location.state?.document && !fileName && pdfLibLoaded) {
      setSelectedDocument(location.state.document);
      loadPdfFromBlob(location.state.document.file);
    }
  }, [location, fileName, pdfLibLoaded]);

  // Render page when pageNumber or pageScale changes
  useEffect(() => {
    if (pdfDoc && pageNumber) {
      renderPageWithHook(pageNumber, highlights, clauseMarkers, riskBadges);
    }
  }, [pdfDoc, pageNumber, pageScale, highlights, clauseMarkers, riskBadges]);

  const { types: documentTypes } = useDocumentTypes();
  const resolveType = (id) => documentTypes.find((t) => t.id === id) || null;
  const effectiveDocTypeId = overrideDocTypeId || detectedDocTypeId;
  const effectiveDocType = resolveType(effectiveDocTypeId);
  const detectedDocType = resolveType(detectedDocTypeId);

  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const validationSlug = effectiveDocType?.validationSlug || null;
  const validation = useValidationSpec(validationSlug);

  const loadServerTypeState = async (docHashValue) => {
    if (!functions || isMockMode) return;
    try {
      const data = (await getDocumentTypeStateCall({ functions, docHash: docHashValue })) || {};

      if (data?.overrideTypeId) setOverrideDocTypeId(data.overrideTypeId);
      if (data?.detected?.typeId) setDetectedDocTypeId(data.detected.typeId);
      if (data?.detected) {
        setDetectedMeta({
          intakeCategory: data.detected.intakeCategory || null,
          confidence: typeof data.detected.confidence === 'number' ? data.detected.confidence : null,
          model: data.detected.model || null,
          updatedAt: data.detected.updatedAt || null,
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load server document type state', e);
    }
  };

  const runServerDetection = async ({ docHashValue, stats, text }) => {
    if (!functions || isMockMode) return;
    try {
      const data = (await detectDocumentTypeCall({ functions, docHash: docHashValue, stats, text })) || {};
      if (data?.typeId) setDetectedDocTypeId(data.typeId);
      setDetectedMeta({
        intakeCategory: data.intakeCategory || null,
        confidence: typeof data.confidence === 'number' ? data.confidence : null,
        model: data.model || 'heuristic-v1',
        updatedAt: null,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to detect document type', e);
    }
  };

  const persistOverride = async (docHashValue, typeId) => {
    try {
      localStorage.setItem(`decodocs:doctype:${docHashValue}`, String(typeId));
    } catch {
      // ignore
    }

    // Persist server-side per puid (users are isolated)
    if (!functions || isMockMode) return;

    try {
      await saveDocTypeOverrideCall({ functions, docHash: docHashValue, typeId });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist doc type override', e);
    }
  };

  // Load PDF from Blob/File object
  const loadPdfFromBlob = async (fileBlob) => {
    if (!window.pdfjsLib || !fileBlob) return;

    try {
      setIsLoading(true);
      const fileNameForDisplay = fileBlob.name || 'document';
      setLoadingMessage(`Loading ${fileNameForDisplay}...`);

      const arrayBuffer = await fileBlob.arrayBuffer();
      console.log('PDF Buffer Size:', arrayBuffer.byteLength);
      const docHashValue = await computeSHA256(arrayBuffer);
      setDocHash(docHashValue);

      // Load per-user override (local) immediately; server-side override is stored per puid.
      try {
        const ov = localStorage.getItem(`decodocs:doctype:${docHashValue}`);
        if (ov) setOverrideDocTypeId(ov);
      } catch {
        // ignore
      }

      // Load detected+override state from Functions (best-effort).
      await loadServerTypeState(docHashValue);

      const lib = window.pdfjsLib;
      const pdf = await lib.getDocument({
        data: arrayBuffer,
        onProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setLoadingMessage(`Loading ${fileNameForDisplay}: ${percent}%`);
        },
      }).promise;

      setPdfDoc(pdf);
      setNumPages(pdf.numPages);

      setLoadingMessage(`Extracting text from ${fileNameForDisplay}...`);
      const extractedText = await extractPdfTextAllPages(pdf);
      setPdfTextContent(extractedText);

      // Stats used by server-side detection + preflight.
      const stats = buildDocStats({ pageCount: pdf.numPages, extractedText, pdfSizeBytes: arrayBuffer.byteLength });
      setDocStats(stats);

      // Seed server-side detection (cheap). This will populate doc_classifications/{docHash}.
      runServerDetection({ docHashValue, stats, text: extractedText });

      setPageNumber(1);
      setLoadingMessage('');
    } catch (error) {
      console.error('Error loading PDF from blob:', error);
      console.error(error.stack);
      setLoadingMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // Load test PDF from public folder
  const loadTestPdf = async (fileName) => {
    if (!window.pdfjsLib) return;

    try {
      setIsLoading(true);
      setLoadingMessage(`Loading ${fileName}...`);

      const pdfUrl = `/test-docs/${fileName}`;
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const docHashValue = await computeSHA256(arrayBuffer);
      setDocHash(docHashValue);

      try {
        const ov = localStorage.getItem(`decodocs:doctype:${docHashValue}`);
        if (ov) setOverrideDocTypeId(ov);
      } catch {
        // ignore
      }

      // Load detected+override state from Functions (best-effort).
      await loadServerTypeState(docHashValue);

      const pdfjsLib = window.pdfjsLib;
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        onProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setLoadingMessage(`Loading ${fileName}: ${percent}%`);
        },
      }).promise;

      setPdfDoc(pdf);
      setNumPages(pdf.numPages);

      setSelectedDocument({
        id: fileName,
        name: fileName,
        size: arrayBuffer.byteLength,
        type: 'application/pdf',
        file: null,
      });

      setLoadingMessage(`Extracting text from ${fileName}...`);
      const extractedText = await extractPdfTextAllPages(pdf);
      setPdfTextContent(extractedText);

      const stats = buildDocStats({ pageCount: pdf.numPages, extractedText, pdfSizeBytes: arrayBuffer.byteLength });
      setDocStats(stats);

      runServerDetection({ docHashValue, stats, text: extractedText });

      setPageNumber(1);
      setLoadingMessage('');
    } catch (error) {
      console.error('Error loading test PDF:', error);
      setLoadingMessage('');
      setGate({
        title: 'Could not load PDF',
        message: error?.message || 'Failed to load test PDF.',
        primaryLabel: 'OK',
        primaryTo: null,
        secondaryLabel: null,
        secondaryTo: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Page navigation handlers
  const goToPreviousPage = () => {
    if (pageNumber <= 1) return;
    setPageNumber(pageNumber - 1);
  };

  const goToNextPage = () => {
    if (pageNumber >= numPages) return;
    setPageNumber(pageNumber + 1);
  };

  const zoomIn = () => {
    setPageScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setPageScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  // Handle file upload
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

  // Preflight check before analysis
  const runPreflightCheck = async () => {
    if (!pdfTextContent || !numPages) return { ok: true, classification: 'OK' };

    // In mock mode, return success immediately
    if (isMockMode) {
      return { ok: true, classification: 'OK' };
    }

    if (!functions) {
      console.error('Firebase functions not available. Returning default response.');
      return { ok: true, classification: 'OK' };
    }

    try {
      const stats = buildDocStats({
        pageCount: numPages,
        extractedText: pdfTextContent,
        pdfSizeBytes: selectedDocument?.size || 0,
      });

      const data = await preflightCheckCall({
        functions,
        docHash,
        stats,
      });

      return data;
    } catch (error) {
      console.error('Preflight check error:', error);
      return { ok: true, classification: 'OK' };
    }
  };

  const handleAnalyzeByType = async () => {
    if (!selectedDocument || !pdfTextContent || !docHash) return;

    if (!isFirebaseAvailable()) {
      console.warn('Type-specific analysis unavailable: Firebase services not accessible.');
      return;
    }

    // Make the results panel deterministic: show a loading state immediately.
    setAnalysisResults((prev) => ({
      ...prev,
      [selectedDocument.id]: {
        ...(prev[selectedDocument.id] || {}),
        _meta: { status: 'loading', message: 'Running type-specific analysis…' },
      },
    }));

    setIsLoading(true);

    try {
      if (isMockMode) {
        setGate({
          title: 'Type-specific analysis (beta)',
          message: 'Not available in mock mode yet.',
          primaryLabel: 'OK',
          primaryTo: null,
          secondaryLabel: null,
          secondaryTo: null,
        });
        setAnalysisResults((prev) => ({
          ...prev,
          [selectedDocument.id]: {
            ...(prev[selectedDocument.id] || {}),
            _meta: { status: 'error', message: 'Not available in mock mode yet.' },
          },
        }));
        return;
      }

      const data = (await analyzeByTypeCall({ functions, docHash, text: pdfTextContent })) || {};

      // Store something useful in the results panel.
      const typeSpecific = {
        ok: !!data.ok,
        effectiveTypeId: data.effectiveTypeId || null,
        validationSlug: data.validationSlug || null,
        validationTitle: data.validationSpec?.title || null,
        message: data.message || null,
        result: data.result || null,
        usage: data.usage || null,
        requiredTier: data.requiredTier || null,
        code: data.code || null,
      };

      setAnalysisResults((prev) => ({
        ...prev,
        [selectedDocument.id]: {
          ...(prev[selectedDocument.id] || {}),
          _meta: { status: 'success' },
          typeSpecific,
        },
      }));

      setGate({
        title: 'Type-specific analysis (beta)',
        message:
          `effectiveTypeId: ${typeSpecific.effectiveTypeId || 'null'}\n` +
          `validationSlug: ${typeSpecific.validationSlug || 'null'}\n\n` +
          (typeSpecific.validationTitle ? `Spec: ${typeSpecific.validationTitle}\n\n` : '') +
          (typeSpecific.message || ''),
        primaryLabel: 'OK',
        primaryTo: null,
        secondaryLabel: null,
        secondaryTo: null,
      });
    } catch (e) {
      console.error('analyzeByType error:', e);
      setAnalysisResults((prev) => ({
        ...prev,
        [selectedDocument.id]: {
          ...(prev[selectedDocument.id] || {}),
          _meta: { status: 'error', message: e?.message || 'Request failed.' },
        },
      }));
      setGate({
        title: 'Type-specific analysis failed',
        message: e?.message || 'Request failed.',
        primaryLabel: 'OK',
        primaryTo: null,
        secondaryLabel: null,
        secondaryTo: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze document using extracted text
  const handleAnalyzeDocument = async () => {
    if (!selectedDocument || !pdfTextContent || !docHash) return;

    if (!isFirebaseAvailable()) {
      console.warn('Document analysis unavailable: Firebase services not accessible.');
      return;
    }

    setAnalysisResults((prev) => ({
      ...prev,
      [selectedDocument.id]: {
        ...(prev[selectedDocument.id] || {}),
        _meta: { status: 'loading', message: 'Running analysis…' },
      },
    }));

    setIsLoading(true);

    try {
      const preflightResult = await runPreflightCheck();

      if (!preflightResult.ok) {
        console.error('Preflight check failed:', preflightResult);
        throw new Error(preflightResult.message || 'Preflight check failed');
      }

      if (preflightResult.classification === 'PRO_REQUIRED') {
        const msg = preflightResult.reasons?.map((r) => r.message).join(' ') || 'This document requires Pro features (OCR / deeper processing).';
        setAnalysisResults((prev) => ({
          ...prev,
          [selectedDocument.id]: {
            ...(prev[selectedDocument.id] || {}),
            _meta: { status: 'error', message: msg },
          },
        }));
        setGate({
          title: 'Pro required',
          message: msg,
          primaryLabel: 'Upgrade to Pro',
          primaryTo: '/pricing',
          secondaryLabel: 'Cancel',
          secondaryTo: null,
        });
        return;
      }

      const stats = buildDocStats({
        pageCount: numPages,
        extractedText: pdfTextContent,
        pdfSizeBytes: selectedDocument?.size || 0,
      });

      const pages = pdfTextContent.split('\f');
      const { charsPerPage, totalChars } = stats;

      let result;
      if (isMockMode) {
        // In mock mode, trigger a fetch that will be intercepted by Playwright
        const response = await fetch('/analyzeText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docHash,
            stats: { pageCount: numPages, charsPerPage, totalChars, languageHint: 'en' },
            text: { format: 'paged', value: pdfTextContent },
            options: { tasks: ['explain', 'caveats', 'inconsistencies'], targetLanguage: null },
          }),
        });
        result = { data: await response.json() };
      } else {
        result = await analyzeTextCall({
          functions,
          payload: {
            docHash,
            stats: {
              pageCount: numPages,
              charsPerPage,
              totalChars,
              languageHint: 'en',
            },
            text: {
              format: 'paged',
              value: pdfTextContent,
              pageTextIndex: pages.map((text, idx) => ({
                page: idx + 1,
                start: 0,
                end: text.length,
              })),
            },
            options: {
              tasks: ['explain', 'caveats', 'inconsistencies'],
              targetLanguage: null,
            },
          },
        });
      }

      if (result.data.ok) {
        setGate(null);
        const mappedAnalysis = {
          _meta: { status: 'success' },
          summary: result.data.result.plainExplanation,
          keyPoints: [],
          risks: result.data.result.risks.map((risk) => ({
            id: risk.id,
            clause: risk.title,
            riskLevel: risk.severity,
            description: risk.whyItMatters,
            explanation: risk.whatToCheck.join('; '),
          })),
          recommendations: result.data.result.risks.flatMap((risk) => risk.whatToCheck || []),
        };

        setAnalysisResults((prev) => ({
          ...prev,
          [selectedDocument.id]: mappedAnalysis,
        }));

        updateAnnotationsFromAnalysis(mappedAnalysis);
      } else {
        const code = result.data.code;
        if (code === 'SCAN_DETECTED_PRO_REQUIRED') {
          const msg = result.data.message || 'This PDF appears to be scanned. OCR is available on Pro.';
          setAnalysisResults((prev) => ({
            ...prev,
            [selectedDocument.id]: {
              ...(prev[selectedDocument.id] || {}),
              _meta: { status: 'error', message: msg },
            },
          }));
          setGate({
            title: 'Scanned PDF (OCR requires Pro)',
            message: msg,
            primaryLabel: 'Upgrade to Pro',
            primaryTo: '/pricing',
            secondaryLabel: 'Cancel',
            secondaryTo: null,
          });
          return;
        }

        if (code === 'ANON_TOKEN_LIMIT') {
          const msg = result.data.message || 'Anonymous token limit reached. Create a free account to continue.';
          setAnalysisResults((prev) => ({
            ...prev,
            [selectedDocument.id]: {
              ...(prev[selectedDocument.id] || {}),
              _meta: { status: 'error', message: msg },
            },
          }));
          setGate({
            title: 'Limit reached',
            message: msg,
            primaryLabel: 'Create free account',
            primaryTo: '/sign-in',
            secondaryLabel: 'Cancel',
            secondaryTo: null,
          });
          return;
        }

        if (code === 'FREE_TOKEN_LIMIT') {
          const msg = result.data.message || 'Daily token limit reached. Upgrade to Pro to continue.';
          setAnalysisResults((prev) => ({
            ...prev,
            [selectedDocument.id]: {
              ...(prev[selectedDocument.id] || {}),
              _meta: { status: 'error', message: msg },
            },
          }));
          setGate({
            title: 'Daily limit reached',
            message: msg,
            primaryLabel: 'Upgrade to Pro',
            primaryTo: '/pricing',
            secondaryLabel: 'Cancel',
            secondaryTo: null,
          });
          return;
        }

        console.error('Analysis failed:', result.data);
        throw new Error(result.data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      setAnalysisResults((prev) => ({
        ...prev,
        [selectedDocument.id]: {
          ...(prev[selectedDocument.id] || {}),
          _meta: { status: 'error', message: error?.message || 'Analysis failed.' },
        },
      }));
      setGate({
        title: 'Analysis failed',
        message: error?.message || 'Request failed.',
        primaryLabel: 'OK',
        primaryTo: null,
        secondaryLabel: null,
        secondaryTo: null,
      });
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Update annotations based on analysis results
  const updateAnnotationsFromAnalysis = (analysis) => {
    const newHighlights = [];
    const newClauseMarkers = [];
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

    setHighlights(newHighlights);
    setClauseMarkers(newClauseMarkers);
    setRiskBadges(newRiskBadges);
  };

  const handleExplainSelection = async () => {
    if (!selectedDocument || !docHash) return;

    if (!isFirebaseAvailable()) {
      console.warn('Explain selection unavailable: Firebase services not accessible.');
      return;
    }

    const selection = 'Limitation of liability clause';

    try {
      let result;
      if (isMockMode) {
        const response = await fetch('/explainSelection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docHash, selection, documentContext: pdfTextContent }),
        });
        result = { data: await response.json() };
      } else {
        const explainSelection = httpsCallable(functions, 'explainSelection');
        result = await explainSelection({
          docHash,
          selection,
          documentContext: pdfTextContent,
        });
      }

      if (result.data.success) {
        alert(`Explanation: ${result.data.explanation.plainExplanation}`);
      } else {
        console.error('Explanation failed:', result.data);
        throw new Error(result.data.error || 'Explanation failed');
      }
    } catch (error) {
      console.error('Error explaining selection:', error);
      throw error;
    }
  };

  const handleHighlightRisks = async () => {
    if (!selectedDocument || !docHash) return;

    if (!isFirebaseAvailable()) {
      console.warn('Risk highlighting unavailable: Firebase services not accessible.');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isMockMode) {
        const response = await fetch('/highlightRisks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docHash, documentText: pdfTextContent, documentType: 'contract' }),
        });
        result = { data: await response.json() };
      } else {
        const highlightRisks = httpsCallable(functions, 'highlightRisks');
        result = await highlightRisks({
          docHash,
          documentText: pdfTextContent,
          documentType: 'contract',
        });
      }

      if (result.data.success) {
        alert(`Found ${result.data.risks.summary.totalRisks} risks in the document.`);

        const newRiskBadges =
          result.data.risks.items?.map((risk, idx) => ({
            id: idx,
            pageNum: 1,
            x: 150 + idx * 40,
            y: 150 + idx * 35,
            level: risk.riskLevel,
            description: risk.description,
            explanation: risk.explanation,
          })) || [];

        setRiskBadges(newRiskBadges);
      } else {
        console.error('Risk highlighting failed:', result.data);
        throw new Error(result.data.error || 'Risk highlighting failed');
      }
    } catch (error) {
      console.error('Error highlighting risks:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateToPlainEnglish = async () => {
    if (!selectedDocument || !docHash) return;

    if (!isFirebaseAvailable()) {
      console.warn('Translation unavailable: Firebase services not accessible.');
      return;
    }

    try {
      const legalText = pdfTextContent.substring(0, 500);

      let result;
      if (isMockMode) {
        const response = await fetch('/translateToPlainEnglish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docHash, legalText }),
        });
        result = { data: await response.json() };
      } else {
        const translateToPlainEnglish = httpsCallable(functions, 'translateToPlainEnglish');
        result = await translateToPlainEnglish({
          docHash,
          legalText,
        });
      }

      if (result.data.success) {
        alert(
          `Original: ${result.data.translation.originalText}\n\nPlain English: ${result.data.translation.plainEnglishTranslation}`
        );
      } else {
        console.error('Translation failed:', result.data);
        throw new Error(result.data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Error translating to plain English:', error);
      throw error;
    }
  };

  const handleEditDocument = () => {
    if (selectedDocument) {
      navigate(`/edit/${selectedDocument.id}`, { state: { document: selectedDocument } });
    }
  };

  // Clean up resources
  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfDoc]);

  return (
    <Layout>
      {gate && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 16,
          }}
          onClick={() => setGate(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              maxWidth: 520,
              width: '100%',
              padding: 18,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>{gate.title}</div>
            <div style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>{gate.message}</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {gate.secondaryLabel && (
                <button
                  type="button"
                  onClick={() => {
                    setGate(null);
                    if (gate.secondaryTo) navigate(gate.secondaryTo);
                  }}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 900, cursor: 'pointer' }}
                >
                  {gate.secondaryLabel}
                </button>
              )}
              {gate.primaryLabel && (
                <button
                  type="button"
                  onClick={async () => {
                    // Special case: confirm document type override
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
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
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
          // Quick validation: if user means to override, confirm before applying.
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

      {criteriaOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: 16,
          }}
          onClick={() => setCriteriaOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              maxWidth: 820,
              width: '100%',
              padding: 18,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>Validation criteria</div>
                <div style={{ marginTop: 6, color: '#475569' }}>
                  Type: <strong>{effectiveDocType?.label || 'Unknown'}</strong>
                  {validationSlug ? <span style={{ color: '#94a3b8' }}> ({validationSlug})</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCriteriaOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#0f172a', padding: 0, lineHeight: 1 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {validation.status === 'loading' && <div style={{ color: '#475569' }}>Loading…</div>}
              {validation.status === 'error' && <div style={{ color: '#991b1b' }}>Could not load criteria.</div>}
              {validation.status === 'ready' && (
                <>
                  <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{validation.spec?.title}</div>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#0f172a', fontSize: 13, lineHeight: 1.6 }}>
                    {validation.spec?.markdown}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 h-[calc(100vh-120px)]">
        {/* PDF Viewer Section */}
        <div className="flex-1 flex flex-col p-5 border-r border-gray-300 min-w-0">
          <PDFControls
            onFileSelect={handleFileUpload}
            onEdit={handleEditDocument}
            currentFileName={selectedDocument?.name}
            pageNumber={pageNumber}
            numPages={numPages}
            pageScale={pageScale}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            fileInputRef={fileInputRef}
          />

          {/* Document type chip + override */}
          {docHash && (
            <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  fontWeight: 900,
                  color: '#0f172a',
                  fontSize: 13,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: '#64748b', fontWeight: 800 }}>Type:</span>
                <span>{effectiveDocType?.label || 'Unknown'}</span>
                {overrideDocTypeId && (
                  <span style={{ color: '#64748b', fontWeight: 800 }}>(overridden)</span>
                )}
                {detectedMeta?.intakeCategory && (
                  <span style={{ color: '#64748b', fontWeight: 800 }}>
                    · {detectedMeta.intakeCategory}
                  </span>
                )}
                {typeof detectedMeta?.confidence === 'number' && (
                  <span style={{ color: '#94a3b8', fontWeight: 800 }}>
                    ({Math.round(detectedMeta.confidence * 100)}%)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTypeSelectorOpen(true)}
                style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 900, cursor: 'pointer' }}
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => setCriteriaOpen(true)}
                disabled={!validationSlug}
                style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 900, cursor: validationSlug ? 'pointer' : 'not-allowed', opacity: validationSlug ? 1 : 0.5 }}
                title={validationSlug ? 'View validation criteria' : 'No criteria spec for this type yet'}
              >
                Criteria
              </button>
            </div>
          )}

          <PDFDisplay
            pdfDoc={pdfDoc}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            canvasRef={canvasRef}
            textLayerRef={textLayerRef}
            annotationsRef={annotationsRef}
          />
        </div>

        {/* Analysis Toolbox Section */}
        <div className="flex flex-col">
          <AnalysisToolbox
            onAnalyzeDocument={handleAnalyzeDocument}
            onAnalyzeByType={handleAnalyzeByType}
            onExplainSelection={handleExplainSelection}
            onHighlightRisks={handleHighlightRisks}
            onTranslateToPlainEnglish={handleTranslateToPlainEnglish}
            isLoading={isLoading}
            isAuthenticated={authState.status === 'authenticated'}
            hasDocument={!!selectedDocument}
          />

          {selectedDocument && (
            <div className="w-[350px] p-5 bg-gray-50 border-l border-gray-300 overflow-y-auto">
              <AnalysisResults analysis={analysisResults[selectedDocument.id]} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DocumentViewer;
