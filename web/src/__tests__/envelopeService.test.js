import { describe, expect, test } from 'vitest';
import JSZip from 'jszip';
import {
  createEnvelopeFromPdf,
  createEnvelopeFileFromPdfFile,
  extractEnvelope,
  openPdfOrEnvelopeFile,
  processEmailToSignClient,
  runClientPreflight,
  validateEnvelopeBytes,
} from '../services/envelopeService';

const makePdfBytes = () =>
  new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

const asArrayBuffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

const makeMockFile = ({ name, type, bytes }) => ({
  name,
  type,
  size: bytes.byteLength,
  arrayBuffer: async () => asArrayBuffer(bytes),
});

describe('envelopeService', () => {
  test('creates, validates, and extracts a valid .snapsign envelope', async () => {
    const pdfBytes = makePdfBytes();
    const analysis = { summary: 'ok' };
    const audit = [{ action: 'created' }];

    const envelopeBytes = await createEnvelopeFromPdf({
      pdfBytes,
      pdfName: 'contract.pdf',
      metadata: { sender: 'u1' },
      analysis,
      audit,
    });

    const validation = await validateEnvelopeBytes(envelopeBytes);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);

    const extracted = await extractEnvelope(envelopeBytes);
    expect(extracted.pdfName).toBe('contract.pdf');
    expect(extracted.analysis).toEqual(analysis);
    expect(extracted.audit).toEqual(audit);
    expect(extracted.manifest.document.sha256).toBeTruthy();
  });

  test('detects tampered envelope payload by hash mismatch', async () => {
    const envelopeBytes = await createEnvelopeFromPdf({
      pdfBytes: makePdfBytes(),
      pdfName: 'contract.pdf',
    });

    const zip = await JSZip.loadAsync(envelopeBytes);
    zip.file('document.pdf', new Uint8Array([1, 2, 3, 4])); // keep old manifest hash -> mismatch
    const tampered = await zip.generateAsync({ type: 'uint8array' });

    const validation = await validateEnvelopeBytes(tampered);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Document hash mismatch'))).toBe(true);
  });

  test('opens both PDF and .snapsign files', async () => {
    const pdfBytes = makePdfBytes();
    const pdfFile = makeMockFile({
      name: 'sample.pdf',
      type: 'application/pdf',
      bytes: pdfBytes,
    });
    const openedPdf = await openPdfOrEnvelopeFile(pdfFile);
    expect(openedPdf.source).toBe('pdf');
    expect(openedPdf.pdfFile.name).toBe('sample.pdf');

    const envelopeFile = await createEnvelopeFileFromPdfFile({ pdfFile });
    const openedEnvelope = await openPdfOrEnvelopeFile(envelopeFile);
    expect(openedEnvelope.source).toBe('snapsign');
    expect(openedEnvelope.envelope.manifest.document.name).toBe('sample.pdf');
    expect(openedEnvelope.pdfFile.type).toBe('application/pdf');
  });

  test('rejects plain .zip uploads that are not .snapsign', async () => {
    const zipBytes = new Uint8Array([80, 75, 3, 4]);
    const zipFile = makeMockFile({
      name: 'archive.zip',
      type: 'application/zip',
      bytes: zipBytes,
    });

    await expect(openPdfOrEnvelopeFile(zipFile)).rejects.toThrow(
      'Unsupported file type. Please upload a .pdf or .snapsign file.'
    );
  });

  test('classifies preflight limits client-side', () => {
    const ok = runClientPreflight({
      pageCount: 2,
      extractedText: `${'a'.repeat(120)}\f${'b'.repeat(120)}`,
      pdfSizeBytes: 1024 * 200,
    });
    expect(ok.classification).toBe('FREE_OK');

    const proRequired = runClientPreflight({
      pageCount: 20,
      extractedText: 'x'.repeat(200),
      pdfSizeBytes: 1024 * 200,
    });
    expect(proRequired.classification).toBe('PRO_REQUIRED');
    expect(proRequired.reasons.some((r) => r.code === 'TOO_MANY_PAGES')).toBe(true);

    const blocked = runClientPreflight({
      pageCount: 1,
      extractedText: 'x'.repeat(200),
      pdfSizeBytes: 21 * 1024 * 1024,
    });
    expect(blocked.classification).toBe('BLOCKED');
    expect(blocked.reasons.some((r) => r.code === 'FILE_TOO_LARGE')).toBe(true);
  });

  test('processEmailToSignClient returns envelope on FREE_OK and blocks over limits', async () => {
    const pdfBytes = makePdfBytes();
    const pdfFile = makeMockFile({
      name: 'offer.pdf',
      type: 'application/pdf',
      bytes: pdfBytes,
    });

    const success = await processEmailToSignClient({
      inputFile: pdfFile,
      extractedText: 'x'.repeat(120),
      pageCount: 1,
      analyzeFn: async () => ({ summary: 'analysis-ok' }),
      metadata: { sender: 'u1' },
    });

    expect(success.status).toBe('success');
    expect(success.envelopeFile).toBeTruthy();
    expect(success.envelopeFile.name.endsWith('.snapsign')).toBe(true);

    const envelopeBytes = new Uint8Array(await success.envelopeFile.arrayBuffer());
    const extracted = await extractEnvelope(envelopeBytes);
    expect(extracted.analysis).toEqual({ summary: 'analysis-ok' });
    expect(Array.isArray(extracted.audit)).toBe(true);
    expect(extracted.audit.length).toBeGreaterThan(0);

    const overLimit = await processEmailToSignClient({
      inputFile: pdfFile,
      extractedText: 'Still readable.',
      pageCount: 30,
      analyzeFn: async () => null,
    });

    expect(overLimit.status).toBe('upgrade_required');
    expect(overLimit.envelopeFile).toBeNull();
  });
});
