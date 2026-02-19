import { useEffect, useState } from 'react';
import {
  createUploadUrl,
  createDownloadUrl,
  uploadViaPresignedUrl,
  downloadBlobViaPresignedUrl,
} from '../services/storageService';
import { openPdfOrEnvelopeFile } from '../services/envelopeService';

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
  setGate,
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

  useEffect(() => {
    if (!fileName || !pdfLibLoaded) return;

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
  }, [fileName, pdfLibLoaded, loadLocalOverride, loadPdfFromBlob, loadServerTypeState, loadTestPdf, runServerDetection, setGate]);

  useEffect(() => {
    if (!location.state?.document || fileName || !pdfLibLoaded) return;

    const doc = location.state.document;
    setSelectedDocument(doc);
    setCloudObjectKey(doc?.cloudKey || null);

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

    setGate({
      title: 'Could not load PDF',
      message: loadError?.message || 'Failed to load PDF.',
      primaryLabel: 'OK',
      primaryTo: null,
    });
    setSelectedDocument(null);
    navigate('/view');
  }, [loadError, navigate, setGate]);

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

  const handleSaveToCloud = async () => {
    const hasMockUploadCallable =
      typeof window !== 'undefined'
      && typeof window.MOCK_STORAGE_CALLABLES?.storageCreateUploadUrl === 'function';
    if (!functions && !hasMockUploadCallable) return;

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
    if (!selectedDocument) return;
    navigate(`/edit/${selectedDocument.id}`, { state: { document: selectedDocument } });
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
