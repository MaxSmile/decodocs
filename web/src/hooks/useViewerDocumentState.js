import { useEffect, useState, useRef } from 'react';
import {
  createUploadUrl,
  createDownloadUrl,
  uploadViaPresignedUrl,
  downloadBlobViaPresignedUrl,
} from '../services/storageService';
import { openPdfOrEnvelopeFile } from '../services/envelopeService';
import { buildEditedPdfBytes } from '../utils/pdfExport.js';

const sanitizeFileName = (name) =>
  String(name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');

export const useViewerDocumentState = ({
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
  resetPdf, // optional - clears pdf state when finishing
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [cloudObjectKey, setCloudObjectKey] = useState(null);
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const loadedDocIdRef = useRef(null); // Track which document was already loaded to prevent re-loads

  useEffect(() => {
    if (!fileName || !pdfLibLoaded) return;
    // Skip reload if same file was already loaded
    if (loadedDocIdRef.current === `test:${fileName}`) return;
    loadedDocIdRef.current = `test:${fileName}`;

    const load = async () => {
      try {
        const result = await loadTestPdf(fileName);
        if (!result) return;

        setSelectedDocument({
          id: fileName,
          name: fileName,
          type: 'application/pdf',
          size: result.fileInfo?.size,
          file: null,
        });
        loadLocalOverride(result.docHash);
        await loadServerTypeState(result.docHash);
        runServerDetection({ docHashValue: result.docHash, stats: result.stats, text: result.text });
      } catch (err) {
        setDialog({
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
  }, [fileName, pdfLibLoaded, loadLocalOverride, loadServerTypeState, loadTestPdf, runServerDetection, setDialog]);

  useEffect(() => {
    if (!location.state?.document || fileName || !pdfLibLoaded) return;

    const doc = location.state.document;
    // Skip reload if same document was already loaded (prevents re-load on unrelated re-renders)
    const docId = doc.id || doc.name;
    if (loadedDocIdRef.current === docId) return;

    setSelectedDocument(doc);
    setCloudObjectKey(doc?.cloudKey || null);
    loadedDocIdRef.current = docId;

    const load = async () => {
      try {
        const result = await loadPdfFromBlob(doc.file);
        if (!result) return;

        loadLocalOverride(result.docHash);
        await loadServerTypeState(result.docHash);
        runServerDetection({ docHashValue: result.docHash, stats: result.stats, text: result.text });
      } catch {
        // load errors are handled by usePdfJs -> loadError effect below
      }
    };

    load();
  }, [fileName, location, pdfLibLoaded, loadLocalOverride, loadPdfFromBlob, loadServerTypeState, runServerDetection]);

  useEffect(() => {
    if (!loadError) return;

    setDialog({
      title: 'Could not load PDF',
      message: loadError?.message || 'Failed to load PDF.',
      primaryLabel: 'OK',
      primaryTo: null,
    });
    setSelectedDocument(null);
    navigate('/view');
  }, [loadError, navigate, setDialog]);

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
      setDialog({
        title: 'Unsupported or invalid file',
        message: err?.message || 'Please upload a valid .pdf or .snapsign file.',
        primaryLabel: 'OK',
      });
    }
  };

  const handleSaveToCloud = async () => {
    const hasMockUploadCallable =
      typeof window !== 'undefined'
      && typeof window.MOCK_STORAGE_CALLABLES?.storageCreateUploadUrl === 'function';
    if (!functions && !hasMockUploadCallable) return;

    if (!selectedDocument?.file) {
      setDialog({
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
      setDialog({
        title: 'Saved to DecoDocs',
        message: `Document uploaded successfully.\nObject key: ${uploadInfo.key}`,
        primaryLabel: 'OK',
      });
    } catch (err) {
      const code = err?.code || '';
      const isProGate = String(code).includes('permission-denied');
      setDialog({
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

  const handleDownload = async ({ signatures = [], annotations = [], pageScale = 1 } = {}) => {
    if (!pdfDoc) return;

    const hasOverlays =
      (Array.isArray(signatures) && signatures.length > 0)
      || (Array.isArray(annotations) && annotations.length > 0);

    if (hasOverlays) {
      try {
        setIsCloudBusy(true);
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
        return;
      } catch (err) {
        setDialog({
          title: 'Download failed',
          message: err?.message || 'Unable to download edited PDF.',
          primaryLabel: 'OK',
        });
        return;
      } finally {
        setIsCloudBusy(false);
      }
    }

    if (selectedDocument?.file) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(selectedDocument.file);
      link.download = selectedDocument?.name || 'document.pdf';
      link.click();
      return;
    }

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
      } catch (err) {
        setDialog({
          title: 'Download failed',
          message: err?.message || 'Unable to download cloud document.',
          primaryLabel: 'OK',
        });
      } finally {
        setIsCloudBusy(false);
      }
    }
  };

  const handleEditDocument = ({ overlays } = {}) => {
    if (!selectedDocument) return;
    navigate(`/edit/${selectedDocument.id}`, { state: { document: selectedDocument, overlays: overlays || null } });
  };

  const handleFinishDocument = () => {
    // clear local selection and fully reset any loaded PDF state so /view shows the initial dropzone
    setSelectedDocument(null);
    try {
      if (typeof resetPdf === 'function') resetPdf();
    } catch (e) {
      /* ignore */
    }
    navigate('/view');
  };

  return {
    selectedDocument,
    isCloudBusy,
    handleFileUpload,
    handleSaveToCloud,
    handleDownload,
    handleEditDocument,
    handleFinishDocument,
  };
};
