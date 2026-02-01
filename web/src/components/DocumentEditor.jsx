import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';

const DocumentEditor = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isSignMode, setIsSignMode] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [signatureDimensions, setSignatureDimensions] = useState({ width: 150, height: 50 });
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get document from location state or create from params
  useEffect(() => {
    if (location.state?.document) {
      setSelectedDocument(location.state.document);
      const url = URL.createObjectURL(location.state.document.file);
      setPdfUrl(url);
    } else if (documentId) {
      // In a real app, you would fetch the document by ID.
      // For now, we keep a lightweight placeholder doc record.
      const mockDoc = {
        id: documentId,
        name: `Document_${documentId}.pdf`,
        size: 102400,
        type: 'application/pdf',
        file: null,
      };
      setSelectedDocument(mockDoc);
    }
  }, [documentId, location]);

  // Load local draft (signatures/annotations) if present.
  useEffect(() => {
    if (!selectedDocument) return;

    try {
      const idPart = selectedDocument?.id || documentId || 'unknown';
      const namePart = selectedDocument?.name || 'document';
      const key = `decodocs:draft:${idPart}:${namePart}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.signatures)) setSignatures(parsed.signatures);
      if (Array.isArray(parsed?.annotations)) setAnnotations(parsed.annotations);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load local draft', e);
    }
  }, [selectedDocument, documentId]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      const newDocument = {
        id: Date.now() + Math.random(),
        name: pdfFiles[0].name,
        size: pdfFiles[0].size,
        type: pdfFiles[0].type,
        file: pdfFiles[0]
      };
      
      const url = URL.createObjectURL(newDocument.file);
      setSelectedDocument(newDocument);
      setPdfUrl(url);
      navigate(`/edit/${newDocument.id}`, { state: { document: newDocument } });
    }
  };

  const getLocalDraftKey = () => {
    const idPart = selectedDocument?.id || documentId || 'unknown';
    const namePart = selectedDocument?.name || 'document';
    return `decodocs:draft:${idPart}:${namePart}`;
  };

  const handleSaveDocument = () => {
    if (!selectedDocument) return;

    const payload = {
      savedAt: new Date().toISOString(),
      document: {
        id: selectedDocument.id || documentId || null,
        name: selectedDocument.name || null,
      },
      signatures,
      annotations,
    };

    try {
      localStorage.setItem(getLocalDraftKey(), JSON.stringify(payload));
      // Minimal UX: avoid alert placeholders; show a short inline notice via the browser.
      // eslint-disable-next-line no-console
      console.log('Draft saved locally');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save draft locally', e);
    }
  };

  const handleDownload = async () => {
    try {
      if (!pdfUrl && !selectedDocument?.file) return;

      const filename = selectedDocument?.name || `document_${selectedDocument?.id || documentId || 'download'}.pdf`;

      let blob;
      if (selectedDocument?.file instanceof File) {
        blob = selectedDocument.file;
      } else {
        const resp = await fetch(pdfUrl);
        if (!resp.ok) throw new Error(`Failed to download PDF (${resp.status})`);
        blob = await resp.blob();
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Download failed', e);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;

    // Print the PDF by opening it in a new tab/window.
    // (Printing an embedded iframe reliably across browsers is inconsistent.)
    const w = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    if (!w) return;

    const tryPrint = () => {
      try {
        w.focus();
        w.print();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Print failed', e);
      }
    };

    // Give the browser a moment to load the PDF renderer.
    w.addEventListener('load', () => setTimeout(tryPrint, 250));
  };

  const toggleSignMode = () => {
    setIsSignMode(!isSignMode);
  };

  const addSignature = (e) => {
    if (!isSignMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSignature = {
      id: Date.now(),
      x,
      y,
      width: signatureDimensions.width,
      height: signatureDimensions.height,
      text: "John Doe",
      date: new Date().toLocaleDateString()
    };
    
    setSignatures([...signatures, newSignature]);
  };

  const addAnnotation = (e) => {
    if (!isSignMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newAnnotation = {
      id: Date.now(),
      x,
      y,
      text: "Important note"
    };
    
    setAnnotations([...annotations, newAnnotation]);
  };

  const addInitial = (e) => {
    if (!isSignMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newInitial = {
      id: Date.now(),
      x,
      y,
      width: 50,
      height: 25,
      text: "JD"
    };
    
    setSignatures([...signatures, newInitial]);
  };

  const addDate = (e) => {
    if (!isSignMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newDate = {
      id: Date.now(),
      x,
      y,
      width: 100,
      height: 25,
      text: new Date().toLocaleDateString()
    };
    
    setSignatures([...signatures, newDate]);
  };

  const handleSignatureChange = (e) => {
    setCurrentSignature(e.target.value);
  };

  const handleDimensionChange = (dimension, value) => {
    setSignatureDimensions(prev => ({
      ...prev,
      [dimension]: parseInt(value)
    }));
  };

  const handleViewDocument = () => {
    if (selectedDocument) {
      navigate(`/view/${selectedDocument.id}`, { state: { document: selectedDocument } });
    }
  };

  return (
    <>
      <header className="App-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1>DecoDocs</h1>
          <p><strong>Decode documents. Act with confidence.</strong></p>
        </Link>
      </header>
      
      <div className="pdf-editor-layout">
        <div className="pdf-editor-container">
          <div className="pdf-controls">
            <button onClick={() => fileInputRef.current?.click()} className="open-pdf-btn">
              Open Different PDF
            </button>
            <button onClick={handleViewDocument} className="view-pdf-btn">
              View Document
            </button>
            <button 
              onClick={toggleSignMode} 
              className={`sign-mode-btn ${isSignMode ? 'active' : ''}`}
            >
              {isSignMode ? 'Exit Sign Mode' : 'Enter Sign Mode'}
            </button>
            {selectedDocument && (
              <span className="current-file">Current: {selectedDocument.name}</span>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".pdf" 
              multiple 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
          
          {pdfUrl ? (
            <div className="pdf-display" onClick={isSignMode ? addSignature : undefined}>
              <iframe 
                src={pdfUrl} 
                title="PDF Editor" 
                width="100%" 
                height="calc(100vh - 200px)"
                type="application/pdf"
              />
              {isSignMode && (
                <>
                  {signatures.map(signature => (
                    <div 
                      key={signature.id}
                      className="signature-element"
                      style={{
                        position: 'absolute',
                        left: `${signature.x}px`,
                        top: `${signature.y}px`,
                        width: `${signature.width}px`,
                        height: `${signature.height}px`,
                        border: '1px solid #007acc',
                        backgroundColor: 'rgba(0, 122, 204, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#007acc',
                        zIndex: 1000
                      }}
                    >
                      {signature.text}
                    </div>
                  ))}
                  
                  {annotations.map(annotation => (
                    <div 
                      key={annotation.id}
                      className="annotation-element"
                      style={{
                        position: 'absolute',
                        left: `${annotation.x}px`,
                        top: `${annotation.y}px`,
                        padding: '5px',
                        backgroundColor: 'yellow',
                        border: '1px solid black',
                        fontSize: '12px',
                        zIndex: 1000
                      }}
                    >
                      {annotation.text}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="pdf-placeholder">
              <p>No PDF selected. Click "Open PDF" to load a document.</p>
            </div>
          )}
        </div>
        
        <div className="editor-toolbox-section">
          <div className="editor-controls">
            <h4>Editor Controls</h4>
            <div className="editor-buttons">
              <button onClick={handleSaveDocument} className="save-btn" disabled={!selectedDocument}>
                Save (local)
              </button>
              <button onClick={handleDownload} className="download-btn" disabled={!pdfUrl && !selectedDocument?.file}>
                Download
              </button>
              <button onClick={handlePrint} className="print-btn" disabled={!pdfUrl}>
                Print
              </button>
            </div>
          </div>
          
          <div className="signing-tools">
            <h4>Signing Tools</h4>
            <div className="signing-buttons">
              <button onClick={(e) => { e.preventDefault(); addSignature(e); }} className="add-signature-btn" disabled={!isSignMode}>
                Add Signature
              </button>
              <button onClick={(e) => { e.preventDefault(); addAnnotation(e); }} className="add-annotation-btn" disabled={!isSignMode}>
                Add Annotation
              </button>
              <button onClick={(e) => { e.preventDefault(); addInitial(e); }} className="add-initial-btn" disabled={!isSignMode}>
                Add Initials
              </button>
              <button onClick={(e) => { e.preventDefault(); addDate(e); }} className="add-date-btn" disabled={!isSignMode}>
                Add Date
              </button>
            </div>
            
            <div className="signature-preview">
              <h4>Signature Settings</h4>
              <div className="signature-dimensions">
                <label>
                  Width: 
                  <input 
                    type="number" 
                    value={signatureDimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    min="50"
                    max="300"
                  />
                </label>
                <label>
                  Height: 
                  <input 
                    type="number" 
                    value={signatureDimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    min="25"
                    max="100"
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="editing-tools">
            <h4>Editing Options</h4>
            <div className="editing-options">
              <div className="tool-option">
                <input 
                  type="checkbox" 
                  id="enable-comments" 
                  checked={isSignMode}
                  onChange={toggleSignMode}
                />
                <label htmlFor="enable-comments">Enable Signing Tools</label>
              </div>
              {/* Document locking is not defined yet; avoid shipping “Coming Soon” placeholders. */}
            </div>
          </div>
          
          <div className="document-info">
            <h4>Document Info</h4>
            <ul>
              <li><strong>Name:</strong> {selectedDocument?.name || 'None selected'}</li>
              <li><strong>Size:</strong> {(selectedDocument?.size / 1024).toFixed(2)} KB</li>
              <li><strong>Type:</strong> {selectedDocument?.type || 'N/A'}</li>
              <li><strong>Signatures:</strong> {signatures.length}</li>
              <li><strong>Annotations:</strong> {annotations.length}</li>
            </ul>
          </div>
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

export default DocumentEditor;