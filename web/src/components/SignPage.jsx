import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePdfJs } from '../hooks/usePdfJs';
import { openPdfOrEnvelopeFile, processEmailToSignClient } from '../services/envelopeService';

const downloadFile = (file) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = file.name || 'envelope.snapsign';
  link.click();
  URL.revokeObjectURL(link.href);
};

const SignPage = () => {
  const location = useLocation();
  const { authState } = useAuth();
  const fileInputRef = useRef(null);

  const { numPages, pdfTextContent, isLoading, loadingMessage, loadPdfFromBlob } = usePdfJs();

  const [inputFile, setInputFile] = useState(null);
  const [openedSource, setOpenedSource] = useState(null);
  const [envelopeInfo, setEnvelopeInfo] = useState(null);
  const [preparedEnvelopeFile, setPreparedEnvelopeFile] = useState(null);
  const [preflight, setPreflight] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const docTitle = useMemo(() => inputFile?.name || 'document.pdf', [inputFile]);

  const handleFileSelect = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    setError('');
    setStatus('');
    setPreparedEnvelopeFile(null);
    setPreflight(null);

    try {
      const opened = await openPdfOrEnvelopeFile(file);
      setInputFile(file);
      setOpenedSource(opened.source);
      setEnvelopeInfo(opened.envelope || null);
      await loadPdfFromBlob(opened.pdfFile);
      if (!emailSubject) {
        setEmailSubject(`Please review and sign: ${opened.pdfFile.name}`);
      }
      if (!emailMessage) {
        setEmailMessage('Please review and sign this document. I have attached the .snapsign envelope.');
      }
    } catch (err) {
      setError(err?.message || 'Unsupported file. Please upload a valid .pdf or .snapsign file.');
    } finally {
      event.target.value = '';
    }
  };

  useEffect(() => {
    const existing = location.state?.document?.file || null;
    if (!existing) return;
    handleFileSelect({ target: { files: [existing], value: '' } });
  }, [location.state]);

  const handlePrepareEnvelope = async () => {
    if (!inputFile) {
      setError('Choose a PDF or .snapsign file first.');
      return;
    }

    if (!numPages || isLoading) {
      setError('Please wait until PDF parsing is complete.');
      return;
    }

    setError('');
    setStatus('Preparing envelope...');
    setPreparedEnvelopeFile(null);

    try {
      const metadata = {
        title: docTitle,
        senderUid: authState?.user?.uid || null,
        recipient: {
          name: recipientName || null,
          email: recipientEmail || null,
        },
        draftEmail: {
          subject: emailSubject || null,
          message: emailMessage || null,
        },
      };

      const result = await processEmailToSignClient({
        inputFile,
        extractedText: pdfTextContent || '',
        pageCount: numPages,
        analyzeFn: null,
        metadata,
      });

      setPreflight(result.preflight || null);

      if (result.status === 'success' && result.envelopeFile) {
        setPreparedEnvelopeFile(result.envelopeFile);
        setStatus('Envelope ready. Download it and send it manually by email.');
        downloadFile(result.envelopeFile);
        return;
      }

      const reasons = result.preflight?.reasons?.map((r) => r.message).join(' ') || 'Envelope preflight failed.';
      setStatus('');
      setError(reasons);
    } catch (err) {
      setStatus('');
      setError(err?.message || 'Failed to prepare envelope.');
    }
  };

  const handleComposeEmail = () => {
    if (!preparedEnvelopeFile) {
      setError('Prepare and download the envelope first.');
      return;
    }

    if (!recipientEmail) {
      setError('Recipient email is required to prepare an email draft.');
      return;
    }

    const subject = emailSubject || `Please review and sign: ${docTitle}`;
    const bodyLines = [
      recipientName ? `Hi ${recipientName},` : 'Hi,',
      '',
      emailMessage || 'Please review and sign this document.',
      '',
      `Attachment to include manually: ${preparedEnvelopeFile.name}`,
      'Open the attachment in DecoDocs, sign in the client, then reply with the updated file.',
      '',
      'This email draft does not attach files automatically. Please attach the downloaded .snapsign file yourself.',
    ];

    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900">Send for Signature</h1>
      <p className="mt-2 text-slate-600">
        Frontend-only workflow: prepare a <code>.snapsign</code> envelope, download it, then send it manually using your own email client.
      </p>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-700">1. Choose document</div>
        <p className="mt-1 text-sm text-slate-500">Accepts PDF and existing .snapsign files.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-900 bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.snapsign,application/pdf,application/zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <span className="text-sm text-slate-600">
            {inputFile ? `${inputFile.name} (${openedSource || 'pdf'})` : 'No file selected'}
          </span>
        </div>
        {envelopeInfo?.manifest?.document?.sha256 && (
          <p className="mt-2 text-xs text-slate-500">
            Existing envelope hash: <code>{envelopeInfo.manifest.document.sha256}</code>
          </p>
        )}
        {isLoading && <p className="mt-2 text-sm text-blue-700">{loadingMessage || 'Parsing PDF...'}</p>}
      </div>

      <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-700">2. Recipient details (optional metadata)</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200"
            placeholder="Recipient name"
          />
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200"
            placeholder="Recipient email"
          />
        </div>
      </div>

      <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-700">3. Manual email draft</div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200"
            placeholder="Email subject"
          />
          <textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            rows={4}
            className="px-3 py-2 rounded-lg border border-slate-200"
            placeholder="Email message"
          />
        </div>
      </div>

      {preflight && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
          <div className="font-semibold text-slate-700">Preflight: {preflight.classification}</div>
          {preflight.reasons?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-slate-600">
              {preflight.reasons.map((reason) => (
                <li key={reason.code}>{reason.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {status && <p className="mt-4 text-sm text-emerald-700">{status}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrepareEnvelope}
          className="px-4 py-2 rounded-lg border border-blue-700 bg-blue-700 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={!inputFile || isLoading}
        >
          Export .snapsign
        </button>
        <button
          type="button"
          onClick={() => preparedEnvelopeFile && downloadFile(preparedEnvelopeFile)}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          disabled={!preparedEnvelopeFile}
        >
          Download Envelope Again
        </button>
        <button
          type="button"
          onClick={handleComposeEmail}
          className="px-4 py-2 rounded-lg border border-slate-900 bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          disabled={!preparedEnvelopeFile || !recipientEmail}
        >
          Open Email Draft
        </button>
      </div>
    </div>
  );
};

export default SignPage;
