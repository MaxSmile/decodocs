import JSZip from 'jszip';
import { computeSHA256 } from '../utils/pdfUtils';
import { buildDocStats } from '../utils/docStats';

const ENVELOPE_VERSION = '1.0';
const MANIFEST_PATH = 'manifest.json';
const DEFAULT_DOCUMENT_PATH = 'document.pdf';
const ANALYSIS_PATH = 'analysis.json';
const AUDIT_PATH = 'audit.json';
const FREE_LIMITS = {
  maxPages: 15,
  maxTokens: 20000,
  maxScanRatio: 0.2,
  maxFileSizeBytes: 20 * 1024 * 1024,
};

const toUint8Array = (input) => {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  // Cross-realm typed arrays (jsdom/vitest) and Node Buffer support.
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  throw new Error('Expected ArrayBuffer or Uint8Array');
};

const readBlobBytes = async (blobLike) => {
  if (blobLike && typeof blobLike.arrayBuffer === 'function') {
    return new Uint8Array(await blobLike.arrayBuffer());
  }
  // Fallback for environments where File/Blob lacks arrayBuffer.
  if (typeof Response !== 'undefined') {
    return new Uint8Array(await new Response(blobLike).arrayBuffer());
  }
  throw new Error('Expected a Blob/File with binary content');
};

const bufferFromBytes = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

const createBinaryFile = ({ bytes, name, type }) => {
  const safeBytes = toUint8Array(bytes);

  class NamedBinaryBlob extends Blob {
    constructor() {
      super([safeBytes], { type });
      this.name = name;
      this.lastModified = Date.now();
    }

    async arrayBuffer() {
      return bufferFromBytes(safeBytes);
    }
  }

  return new NamedBinaryBlob();
};

const findPdfEntry = (zip) => {
  const all = Object.values(zip.files).filter((f) => !f.dir);
  const exact = all.find((f) => f.name === DEFAULT_DOCUMENT_PATH);
  if (exact) return exact;
  return all.find((f) => f.name.toLowerCase().endsWith('.pdf')) || null;
};

const buildManifest = async (pdfBytes, pdfName, metadata = {}) => {
  const hash = await computeSHA256(pdfBytes);
  return {
    version: ENVELOPE_VERSION,
    createdAt: new Date().toISOString(),
    document: {
      path: DEFAULT_DOCUMENT_PATH,
      name: pdfName || DEFAULT_DOCUMENT_PATH,
      mimeType: 'application/pdf',
      sizeBytes: pdfBytes.byteLength,
      sha256: hash,
    },
    metadata,
  };
};

export async function createEnvelopeFromPdf({ pdfBytes, pdfName, metadata = {}, analysis = null, audit = [] }) {
  const bytes = toUint8Array(pdfBytes);
  const zip = new JSZip();
  const manifest = await buildManifest(bytes, pdfName, metadata);

  zip.file(DEFAULT_DOCUMENT_PATH, bytes);
  zip.file(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  if (analysis && typeof analysis === 'object') {
    zip.file(ANALYSIS_PATH, JSON.stringify(analysis, null, 2));
  }
  if (Array.isArray(audit) && audit.length > 0) {
    zip.file(AUDIT_PATH, JSON.stringify(audit, null, 2));
  }

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function validateEnvelopeBytes(envelopeBytes) {
  const bytes = toUint8Array(envelopeBytes);
  const errors = [];
  const warnings = [];
  let info = null;

  try {
    const zip = await JSZip.loadAsync(bytes);
    const manifestFile = zip.file(MANIFEST_PATH);
    const pdfFile = findPdfEntry(zip);

    if (!manifestFile) errors.push('Missing manifest.json');
    if (!pdfFile) errors.push('Missing PDF document');

    if (manifestFile) {
      const manifestText = await manifestFile.async('text');
      const manifest = JSON.parse(manifestText);
      info = manifest;

      if (!manifest?.document?.sha256) warnings.push('Manifest missing document.sha256');
      if (manifest?.version !== ENVELOPE_VERSION) {
        warnings.push(`Unexpected envelope version: ${manifest?.version || 'unknown'}`);
      }

      if (pdfFile && manifest?.document?.sha256) {
        const pdfBytes = await pdfFile.async('uint8array');
        const actualHash = await computeSHA256(pdfBytes);
        if (actualHash !== manifest.document.sha256) {
          errors.push('Document hash mismatch');
        }
      }
    }
  } catch (error) {
    errors.push(`Invalid archive: ${error.message}`);
  }

  return { valid: errors.length === 0, errors, warnings, info };
}

export async function extractEnvelope(envelopeBytes) {
  const bytes = toUint8Array(envelopeBytes);
  const validation = await validateEnvelopeBytes(bytes);
  if (!validation.valid) {
    throw new Error(`Invalid envelope: ${validation.errors.join('; ')}`);
  }

  const zip = await JSZip.loadAsync(bytes);
  const manifestFile = zip.file(MANIFEST_PATH);
  const pdfFile = findPdfEntry(zip);

  if (!manifestFile) throw new Error('Envelope is missing manifest.json');
  if (!pdfFile) throw new Error('Envelope is missing a PDF document');

  const manifest = JSON.parse(await manifestFile.async('text'));
  const pdfBytes = await pdfFile.async('uint8array');
  const analysisText = await zip.file(ANALYSIS_PATH)?.async('text');
  const auditText = await zip.file(AUDIT_PATH)?.async('text');

  return {
    manifest,
    analysis: analysisText ? JSON.parse(analysisText) : null,
    audit: auditText ? JSON.parse(auditText) : [],
    pdfBytes,
    pdfName: manifest?.document?.name || pdfFile.name || DEFAULT_DOCUMENT_PATH,
  };
}

export async function openPdfOrEnvelopeFile(file) {
  if (!file) throw new Error('No file provided');

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    return { source: 'pdf', pdfFile: file, envelope: null };
  }

  const isEnvelope = file.name.toLowerCase().endsWith('.snapsign') || file.type === 'application/zip';
  if (!isEnvelope) {
    throw new Error('Unsupported file type. Please upload a .pdf or .snapsign file.');
  }

  const envelopeBytes = await readBlobBytes(file);
  const extracted = await extractEnvelope(envelopeBytes);
  const pdfName = extracted.pdfName.replace(/\.snapsign$/i, '.pdf');
  const pdfFile = createBinaryFile({
    bytes: extracted.pdfBytes,
    name: pdfName,
    type: 'application/pdf',
  });

  return {
    source: 'snapsign',
    pdfFile,
    envelope: extracted,
  };
}

export async function createEnvelopeFileFromPdfFile({ pdfFile, metadata = {}, analysis = null, audit = [] }) {
  if (!pdfFile) throw new Error('Missing pdfFile');
  const pdfBytes = await readBlobBytes(pdfFile);
  const envelopeBytes = await createEnvelopeFromPdf({
    pdfBytes,
    pdfName: pdfFile.name,
    metadata,
    analysis,
    audit,
  });
  const outName = pdfFile.name.replace(/\.pdf$/i, '') + '.snapsign';
  return createBinaryFile({ bytes: envelopeBytes, name: outName, type: 'application/zip' });
}

export function runClientPreflight({ pageCount, extractedText, pdfSizeBytes }) {
  const stats = buildDocStats({ pageCount, extractedText, pdfSizeBytes });
  const lowTextPages = stats.charsPerPage.filter((chars) => chars < 50).length;
  const scanRatio = stats.pageCount > 0 ? lowTextPages / stats.pageCount : 0;
  const estimatedTokens = Math.ceil(stats.totalChars / 4);
  const reasons = [];
  let classification = 'FREE_OK';

  if (pdfSizeBytes > FREE_LIMITS.maxFileSizeBytes) {
    classification = 'BLOCKED';
    reasons.push({
      code: 'FILE_TOO_LARGE',
      message: `File exceeds ${Math.round(FREE_LIMITS.maxFileSizeBytes / 1024 / 1024)}MB limit`,
    });
  }
  if (classification !== 'BLOCKED' && pageCount > FREE_LIMITS.maxPages) {
    classification = 'PRO_REQUIRED';
    reasons.push({
      code: 'TOO_MANY_PAGES',
      message: `Document has ${pageCount} pages (max ${FREE_LIMITS.maxPages} for free)`,
    });
  }
  if (classification !== 'BLOCKED' && estimatedTokens > FREE_LIMITS.maxTokens) {
    classification = 'PRO_REQUIRED';
    reasons.push({
      code: 'TOO_MANY_TOKENS',
      message: `Document content (~${estimatedTokens} tokens) exceeds free limit`,
    });
  }
  if (classification !== 'BLOCKED' && scanRatio > FREE_LIMITS.maxScanRatio) {
    classification = 'PRO_REQUIRED';
    reasons.push({
      code: 'SCANNED_PDF',
      message: `Document is ${Math.round(scanRatio * 100)}% scanned (OCR needed for free)`,
    });
  }

  return {
    classification,
    valid: classification === 'FREE_OK' || classification === 'PRO_REQUIRED',
    estimatedTokens,
    scanRatio,
    stats,
    reasons,
  };
}

export async function processEmailToSignClient({
  inputFile,
  extractedText,
  pageCount,
  analyzeFn,
  metadata = {},
}) {
  const opened = await openPdfOrEnvelopeFile(inputFile);
  const preflight = runClientPreflight({
    pageCount,
    extractedText,
    pdfSizeBytes: opened.pdfFile.size,
  });

  if (preflight.classification !== 'FREE_OK') {
    return {
      status: preflight.classification === 'BLOCKED' ? 'blocked' : 'upgrade_required',
      preflight,
      envelopeFile: null,
    };
  }

  const analysis = typeof analyzeFn === 'function' ? await analyzeFn() : null;
  const envelopeFile = await createEnvelopeFileFromPdfFile({
    pdfFile: opened.pdfFile,
    metadata,
    analysis,
    audit: [{ action: 'client_analysis', createdAt: new Date().toISOString() }],
  });

  return {
    status: 'success',
    preflight,
    analysis,
    envelopeFile,
  };
}
