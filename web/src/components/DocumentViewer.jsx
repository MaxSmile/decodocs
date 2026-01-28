import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { getIdToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext.jsx';
// Use local worker from public folder to ensure stability in tests and offline
const pdfWorker = '/pdf.worker.min.mjs';
// import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Utility function to compute SHA-256 hash
const computeSHA256 = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Function to detect scanned documents
const detectScannedDocument = (textContent, numPages) => {
  if (!textContent || numPages === 0) return 0;
  
  const MIN_CHARS_PER_PAGE = 50; // Threshold for determining if a page is scanned
  const pages = textContent.split('\f'); // Assuming form feed character separates pages
  let pagesWithLowText = 0;
  
  for (let i = 0; i < Math.min(pages.length, numPages); i++) {
    const pageText = pages[i] || '';
    if (pageText.trim().length < MIN_CHARS_PER_PAGE) {
      pagesWithLowText++;
    }
  }
  
  return pagesWithLowText / numPages; // Return ratio of pages with low text
};

const DocumentViewer = () => {
  const { authState, app, auth } = useAuth();
  
  const [analysisResults, setAnalysisResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageScale, setPageScale] = useState(1.5);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [pdfTextContent, setPdfTextContent] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [clauseMarkers, setClauseMarkers] = useState([]);
  const [riskBadges, setRiskBadges] = useState([]);
  const [docHash, setDocHash] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const annotationsRef = useRef(null);
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize Firebase functions reference - updated to use context auth
  const functions = app ? getFunctions(app) : null;

  // Initialize PDF.js worker
  useEffect(() => {
    const initPdfJs = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set the worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
      
      window.pdfjsLib = pdfjsLib;
    };
    
    initPdfJs();
  }, []);

  // Get document from location state
  useEffect(() => {
    if (location.state?.document) {
      setSelectedDocument(location.state.document);
      loadPdfFromBlob(location.state.document.file);
    }
  }, [location]);

  // Load PDF from Blob/File object
  const loadPdfFromBlob = async (fileBlob) => {
    if (!window.pdfjsLib || !fileBlob) return;

    try {
      setIsLoading(true);
      
      // Convert blob to array buffer
      const arrayBuffer = await fileBlob.arrayBuffer();
      
      // Compute document hash from PDF bytes
      const docHashValue = await computeSHA256(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      setDocHash(docHashValue);
      
      const pdfjsLib = window.pdfjsLib;
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      
      // Extract text content from the entire PDF
      await extractPdfText(pdf);
      
      // Render the first page
      await renderPage(1);
    } catch (error) {
      console.error('Error loading PDF from blob:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract text content from PDF
  const extractPdfText = async (pdf) => {
    try {
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\f'; // Form feed character to separate pages
      }
      setPdfTextContent(fullText);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      // Fallback text content
      setPdfTextContent('PDF text content');
    }
  };

  // Render a specific page with text layer and annotations
  const renderPage = async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Calculate viewport
      const scale = pageScale;
      const viewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Render text layer for selection and searching
      renderTextLayer(page, viewport);

      // Render annotations/highlights if any
      renderAnnotations(pageNum, viewport);
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // Render text layer for selection and searching
  const renderTextLayer = async (page, viewport) => {
    if (!textLayerRef.current) return;

    // Clear previous text layer
    textLayerRef.current.innerHTML = '';

    try {
      const textContent = await page.getTextContent();
      const texts = textContent.items;
      const transform = viewport.transform;

      for (const item of texts) {
        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.position = 'absolute';
        span.style.color = 'transparent';
        span.style.whiteSpace = 'pre';
        span.style.left = `${item.transform[4]}px`;
        span.style.top = `${item.transform[5]}px`;
        span.style.fontSize = `${item.height}px`;
        span.style.fontFamily = 'sans-serif';
        span.style.lineHeight = '1';

        // Apply transformation matrix
        const tx = transform[0] * item.transform[4] + transform[2] * item.transform[5] + transform[4];
        const ty = transform[1] * item.transform[4] + transform[3] * item.transform[5] + transform[5];
        
        span.style.left = `${tx}px`;
        span.style.top = `${ty}px`;
        span.style.width = `${item.width * transform[0]}px`;
        span.style.height = `${item.height * transform[3]}px`;

        textLayerRef.current.appendChild(span);
      }
    } catch (error) {
      console.error('Error rendering text layer:', error);
    }
  };

  // Render annotations/highlights
  const renderAnnotations = (pageNum, viewport) => {
    if (!annotationsRef.current) return;

    // Clear previous annotations
    annotationsRef.current.innerHTML = '';

    // Render highlights for this page
    highlights
      .filter(h => h.pageNum === pageNum)
      .forEach(highlight => {
        const highlightEl = document.createElement('div');
        highlightEl.className = 'highlight-overlay';
        highlightEl.style.position = 'absolute';
        highlightEl.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        highlightEl.style.border = '1px solid rgba(255, 255, 0, 0.5)';
        highlightEl.style.left = `${highlight.x}px`;
        highlightEl.style.top = `${highlight.y}px`;
        highlightEl.style.width = `${highlight.width}px`;
        highlightEl.style.height = `${highlight.height}px`;
        highlightEl.style.pointerEvents = 'none';
        highlightEl.dataset.page = pageNum;

        annotationsRef.current.appendChild(highlightEl);
      });

    // Render clause markers for this page
    clauseMarkers
      .filter(marker => marker.pageNum === pageNum)
      .forEach(marker => {
        const markerEl = document.createElement('div');
        markerEl.className = 'clause-marker';
        markerEl.style.position = 'absolute';
        markerEl.style.left = `${marker.x}px`;
        markerEl.style.top = `${marker.y}px`;
        markerEl.style.width = '20px';
        markerEl.style.height = '20px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.backgroundColor = 'rgba(0, 123, 255, 0.7)';
        markerEl.style.cursor = 'pointer';
        markerEl.style.zIndex = '10';
        markerEl.title = marker.text;
        markerEl.onclick = () => showClauseDetails(marker);

        annotationsRef.current.appendChild(markerEl);
      });

    // Render risk badges for this page
    riskBadges
      .filter(badge => badge.pageNum === pageNum)
      .forEach(badge => {
        const badgeEl = document.createElement('div');
        badgeEl.className = 'risk-badge';
        badgeEl.style.position = 'absolute';
        badgeEl.style.left = `${badge.x}px`;
        badgeEl.style.top = `${badge.y}px`;
        badgeEl.style.padding = '2px 6px';
        badgeEl.style.borderRadius = '10px';
        badgeEl.style.fontSize = '12px';
        badgeEl.style.fontWeight = 'bold';
        badgeEl.style.color = 'white';
        badgeEl.style.backgroundColor = badge.level === 'high' ? '#dc3545' : badge.level === 'medium' ? '#fd7e14' : '#ffc107';
        badgeEl.style.cursor = 'pointer';
        badgeEl.style.zIndex = '10';
        badgeEl.title = badge.description;
        badgeEl.onclick = () => showRiskDetails(badge);

        badgeEl.textContent = badge.level.toUpperCase();

        annotationsRef.current.appendChild(badgeEl);
      });
  };

  // Show clause details
  const showClauseDetails = (clauseMarker) => {
    alert(`Clause: ${clauseMarker.text}\n\n${clauseMarker.details || 'No details available.'}`);
  };

  // Show risk details
  const showRiskDetails = (riskBadge) => {
    alert(`Risk: ${riskBadge.description}\n\n${riskBadge.explanation || 'No explanation available.'}`);
  };

  // Page navigation handlers
  const goToPreviousPage = () => {
    if (pageNumber <= 1) return;
    setPageNumber(pageNumber - 1);
    renderPage(pageNumber - 1);
  };

  const goToNextPage = () => {
    if (pageNumber >= numPages) return;
    setPageNumber(pageNumber + 1);
    renderPage(pageNumber + 1);
  };

  const zoomIn = () => {
    setPageScale(prev => Math.min(prev + 0.2, 3.0));
    renderPage(pageNumber);
  };

  const zoomOut = () => {
    setPageScale(prev => Math.max(prev - 0.2, 0.5));
    renderPage(pageNumber);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      const file = pdfFiles[0];
      const newDocument = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };
      
      setSelectedDocument(newDocument);
      navigate('/view', { state: { document: newDocument } });
    }
  };

  // Preflight check before analysis
  const runPreflightCheck = async () => {
    if (!pdfTextContent || !numPages) return { ok: true, classification: 'FREE_OK' }; // Default to OK if no data
    
    // Check if Firebase functions are available
    if (!functions) {
      console.error('Firebase functions not available. Returning default response.');
      return { ok: true, classification: 'FREE_OK' };
    }
    
    try {
      // Count characters per page
      const pages = pdfTextContent.split('\f');
      const charsPerPage = pages.map(page => page.length);
      const totalChars = pages.reduce((sum, page) => sum + page.length, 0);
      
      // Call the preflight check function
      const preflightCheck = httpsCallable(functions, 'preflightCheck');
      const result = await preflightCheck({
        docHash,
        stats: {
          pageCount: numPages,
          charsPerPage,
          totalChars,
          pdfSizeBytes: selectedDocument?.size || 0
        }
      });
      
      return result.data;
    } catch (error) {
      console.error('Preflight check error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // Log the full error for debugging
      if (error.details?.details) {
        console.error('Function error details:', error.details.details);
      }
      
      // Default to allowing the request if preflight fails
      return { ok: true, classification: 'FREE_OK' };
    }
  };

  // Analyze document using extracted text
  const handleAnalyzeDocument = async () => {
    if (!selectedDocument || !pdfTextContent || !docHash) return;
    
    if (authState.status === 'error') {
      alert('Document analysis requires authentication. Please refresh the page and try again.');
      return;
    }
    
    // Check if Firebase functions are available
    if (!functions) {
      console.error('Firebase functions not available. Please ensure Firebase is properly configured.');
      alert('Firebase services are not available. Please contact support or ensure the app is properly configured.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Run preflight check first
      const preflightResult = await runPreflightCheck();
      
      if (!preflightResult.ok) {
        if (preflightResult.code === 'SCAN_DETECTED_PRO_REQUIRED' || preflightResult.code === 'AI_BUDGET_EXCEEDED_PRO_REQUIRED') {
          // Show upgrade message
          alert(`This document requires deeper analysis, available on Pro. ${preflightResult.message}`);
          return;
        } else {
          console.error('Preflight check failed:', preflightResult);
          throw new Error(preflightResult.message || 'Preflight check failed');
        }
      }
      
      if (preflightResult.classification !== 'FREE_OK') {
        // Show upgrade message
        alert(`This document requires deeper analysis, available on Pro. ${preflightResult.reasons?.map(r => r.message).join(', ') || ''}`);
        return;
      }
      
      // Prepare document statistics
      const pages = pdfTextContent.split('\f');
      const charsPerPage = pages.map(page => page.length);
      const totalChars = pages.reduce((sum, page) => sum + page.length, 0);
      
      // Call the Firebase Function for analysis using extracted text
      const analyzeText = httpsCallable(functions, 'analyzeText');
      const result = await analyzeText({
        docHash,
        stats: {
          pageCount: numPages,
          charsPerPage,
          totalChars,
          languageHint: 'en'
        },
        text: {
          format: 'paged',
          value: pdfTextContent,
          pageTextIndex: pages.map((text, idx) => ({
            page: idx + 1,
            start: 0,
            end: text.length
          }))
        },
        options: {
          tasks: ['explain', 'caveats', 'inconsistencies'],
          targetLanguage: null
        }
      });
      
      if (result.data.ok) {
        // Map the new result structure to the existing format for compatibility
        const mappedAnalysis = {
          summary: result.data.result.plainExplanation,
          keyPoints: [],
          risks: result.data.result.risks.map(risk => ({
            id: risk.id,
            clause: risk.title,
            riskLevel: risk.severity,
            description: risk.whyItMatters,
            explanation: risk.whatToCheck.join('; ')
          })),
          recommendations: result.data.result.risks.flatMap(risk => risk.whatToCheck || [])
        };
        
        setAnalysisResults(prev => ({
          ...prev,
          [selectedDocument.id]: mappedAnalysis
        }));
        
        // Update highlights, clause markers, and risk badges based on analysis
        updateAnnotationsFromAnalysis(mappedAnalysis);
      } else {
        if (result.data.code === 'SCAN_DETECTED_PRO_REQUIRED' || result.data.code === 'AI_BUDGET_EXCEEDED_PRO_REQUIRED') {
          // Show upgrade message
          alert(`This document requires deeper analysis, available on Pro. ${result.data.message}`);
        } else {
          console.error('Analysis failed:', result.data);
          throw new Error(result.data.message || 'Analysis failed');
        }
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // Log additional details if available
      if (error.details?.details) {
        console.error('Function error details:', error.details.details);
      }
      
      throw error; // Re-throw the error instead of falling back to mock data
    } finally {
      setIsLoading(false);
    }
  };

  // Update annotations based on analysis results
  const updateAnnotationsFromAnalysis = (analysis) => {
    // Create highlights based on risk clauses
    const newHighlights = [];
    const newClauseMarkers = [];
    const newRiskBadges = [];

    // Add risk badges for identified risks
    if (analysis.risks && analysis.risks.length > 0) {
      analysis.risks.forEach((risk, index) => {
        // For demo purposes, place risk badges at arbitrary positions
        // In a real implementation, these would be positioned based on text location
        newRiskBadges.push({
          id: index,
          pageNum: 1, // For demo, place on first page
          x: 100 + (index * 50),
          y: 100 + (index * 40),
          level: risk.riskLevel,
          description: risk.description,
          explanation: risk.explanation
        });
      });
    }

    setHighlights(newHighlights);
    setClauseMarkers(newClauseMarkers);
    setRiskBadges(newRiskBadges);
    
    // Re-render current page to show new annotations
    renderPage(pageNumber);
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return '#dc3545'; // red
      case 'medium': return '#fd7e14'; // orange
      case 'low': return '#ffc107'; // yellow
      default: return '#6c757d'; // gray
    }
  };

  const handleExplainSelection = async () => {
    if (!selectedDocument || !docHash) return;
    
    if (authState.status === 'error') {
      alert('This feature requires authentication. Please refresh the page and try again.');
      return;
    }
    
    // Check if Firebase functions are available
    if (!functions) {
      console.error('Firebase functions not available. Please ensure Firebase is properly configured.');
      alert('Firebase services are not available. Please contact support or ensure the app is properly configured.');
      return;
    }
    
    // For demo purposes, we'll use a sample selection
    const selection = "Limitation of liability clause";
    
    try {
      const explainSelection = httpsCallable(functions, 'explainSelection');
      const result = await explainSelection({
        docHash,
        selection,
        documentContext: pdfTextContent
      });
      
      if (result.data.success) {
        alert(`Explanation: ${result.data.explanation.plainExplanation}`);
      } else {
        console.error('Explanation failed:', result.data);
        throw new Error(result.data.error || 'Explanation failed');
      }
    } catch (error) {
      console.error('Error explaining selection:', error);
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      if (error.details?.details) {
        console.error('Function error details:', error.details.details);
      }
      
      throw error; // Re-throw instead of fallback
    }
  };

  const handleHighlightRisks = async () => {
    if (!selectedDocument || !docHash) return;
    
    if (authState.status === 'error') {
      alert('Risk highlighting requires authentication. Please refresh the page and try again.');
      return;
    }
    
    // Check if Firebase functions are available
    if (!functions) {
      console.error('Firebase functions not available. Please ensure Firebase is properly configured.');
      alert('Firebase services are not available. Please contact support or ensure the app is properly configured.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const highlightRisks = httpsCallable(functions, 'highlightRisks');
      const result = await highlightRisks({
        docHash,
        documentText: pdfTextContent,
        documentType: 'contract'
      });
      
      if (result.data.success) {
        alert(`Found ${result.data.risks.summary.totalRisks} risks in the document.`);
        
        // Update risk badges based on API results
        const newRiskBadges = result.data.risks.items?.map((risk, idx) => ({
          id: idx,
          pageNum: 1, // In a real implementation, position based on text location
          x: 150 + (idx * 40),
          y: 150 + (idx * 35),
          level: risk.riskLevel,
          description: risk.description,
          explanation: risk.explanation
        })) || [];
        
        setRiskBadges(newRiskBadges);
        renderPage(pageNumber);
      } else {
        console.error('Risk highlighting failed:', result.data);
        throw new Error(result.data.error || 'Risk highlighting failed');
      }
    } catch (error) {
      console.error('Error highlighting risks:', error);
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      if (error.details?.details) {
        console.error('Function error details:', error.details.details);
      }
      
      throw error; // Re-throw instead of fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateToPlainEnglish = async () => {
    if (!selectedDocument || !docHash) return;
    
    if (authState.status === 'error') {
      alert('Translation requires authentication. Please refresh the page and try again.');
      return;
    }
    
    // Check if Firebase functions are available
    if (!functions) {
      console.error('Firebase functions not available. Please ensure Firebase is properly configured.');
      alert('Firebase services are not available. Please contact support or ensure the app is properly configured.');
      return;
    }
    
    try {
      const legalText = pdfTextContent.substring(0, 500); // Use first 500 chars for demo
      
      const translateToPlainEnglish = httpsCallable(functions, 'translateToPlainEnglish');
      const result = await translateToPlainEnglish({
        docHash,
        legalText
      });
      
      if (result.data.success) {
        alert(`Original: ${result.data.translation.originalText}\n\nPlain English: ${result.data.translation.plainEnglishTranslation}`);
      } else {
        console.error('Translation failed:', result.data);
        throw new Error(result.data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Error translating to plain English:', error);
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      if (error.details?.details) {
        console.error('Function error details:', error.details.details);
      }
      
      throw error; // Re-throw instead of fallback
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
    <>
      <header className="App-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1>DecoDocs</h1>
          <p><strong>Decode documents. Act with confidence.</strong></p>
        </Link>
      </header>
      
      <div className="pdf-viewer-layout">
        <div className="pdf-viewer-container">
          <div className="pdf-controls">
            <button onClick={() => fileInputRef.current?.click()} className="open-pdf-btn">
              Open Different PDF
            </button>
            <button onClick={handleEditDocument} className="edit-pdf-btn">
              Edit & Sign
            </button>
            {selectedDocument && (
              <span className="current-file">Current: {selectedDocument.name}</span>
            )}
            <div className="pdf-navigation">
              <button onClick={goToPreviousPage} disabled={pageNumber <= 1}>‹ Prev</button>
              <span>Page {pageNumber} of {numPages}</span>
              <button onClick={goToNextPage} disabled={pageNumber >= numPages}>Next ›</button>
            </div>
            <div className="pdf-zoom">
              <button onClick={zoomOut}>Zoom Out</button>
              <span>{Math.round(pageScale * 100)}%</span>
              <button onClick={zoomIn}>Zoom In</button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".pdf" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
          
          <div 
            className="pdf-display" 
            style={{ 
              height: 'calc(100vh - 200px)', 
              overflow: 'auto',
              position: 'relative',
              backgroundColor: '#f0f0f0'
            }}
          >
            {pdfDoc ? (
              <div 
                style={{ 
                  position: 'relative', 
                  margin: '0 auto',
                  width: 'fit-content'
                }}
              >
                <canvas 
                  ref={canvasRef} 
                  style={{ 
                    display: 'block',
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    backgroundColor: 'white',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                  }}
                />
                
                {/* Text layer for selection and searching */}
                <div
                  ref={textLayerRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    opacity: 0,
                    lineHeight: 1
                  }}
                />
                
                {/* Annotations overlay */}
                <div
                  ref={annotationsRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
            ) : selectedDocument ? (
              <div className="pdf-loading">
                Loading PDF...
              </div>
            ) : (
              <div className="pdf-placeholder">
                <p>No PDF selected. Click "Open PDF" to load a document.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="toolbox-section">
          <h3>Document Analysis Tools</h3>
          <div className="toolbox-buttons">
            <button onClick={handleAnalyzeDocument} disabled={!selectedDocument || isLoading || authState.status !== 'authenticated'}>
              {isLoading ? 'Analyzing...' : 'Analyze Document'}
            </button>
            <button onClick={handleExplainSelection} disabled={!selectedDocument || authState.status !== 'authenticated'}>
              Explain Selection
            </button>
            <button onClick={handleHighlightRisks} disabled={!selectedDocument || authState.status !== 'authenticated' || isLoading}>
              Highlight Risks
            </button>
            <button onClick={handleTranslateToPlainEnglish} disabled={!selectedDocument || authState.status !== 'authenticated'}>
              Translate to Plain English
            </button>
            <button disabled={!selectedDocument || authState.status !== 'authenticated'}>
              Summarize Key Points
            </button>
            <button disabled={!selectedDocument || authState.status !== 'authenticated'}>
              Suggest Improvements
            </button>
          </div>
          
          {analysisResults[selectedDocument?.id] && (
            <div className="analysis-results">
              <h4>Analysis Results</h4>
              <div className="summary-section">
                <h5>Document Summary</h5>
                <p>{analysisResults[selectedDocument.id].summary}</p>
              </div>
              
              <div className="risks-section">
                <h5>Identified Risks</h5>
                {analysisResults[selectedDocument.id].risks.map(risk => (
                  <div key={risk.id} className="risk-item">
                    <div className="risk-header" style={{ borderLeft: `4px solid ${getRiskColor(risk.riskLevel)}` }}>
                      <h6>{risk.clause}</h6>
                      <span className="risk-level" style={{ backgroundColor: getRiskColor(risk.riskLevel) }}>
                        {risk.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="risk-content">
                      <p><strong>Risk:</strong> {risk.description}</p>
                      <p><strong>Plain Language:</strong> {risk.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="recommendations-section">
                <h5>Recommendations</h5>
                <ul>
                  {analysisResults[selectedDocument.id].recommendations.map((rec, index) => (
                    <li key={index} className="recommendation-item">
                      <div className="recommendation-content">{rec}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="standard-footer">
        <div className="footer-content">
          <p>© SnapSign Pty Ltd</p>
          <p>ABN 72 679 570 757</p>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default DocumentViewer;