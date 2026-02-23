const decodeDataUrl = (dataUrl) => {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] || '';
  const base64 = match[2] || '';
  const binary = typeof atob === 'function'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { mimeType, bytes };
};

const sanitizePdfText = (value) => {
  const text = String(value || '');
  // pdf-lib standard fonts use WinAnsi encoding. Keep it simple and safe.
  return text
    .replaceAll('✓', 'X')
    .replaceAll('✔', 'X')
    .replaceAll('🖼', '[Image]');
};

export const buildEditedPdfBytes = async ({
  pdfBytes,
  pageScale = 1,
  signatures = [],
  annotations = [],
} = {}) => {
  if (!pdfBytes) throw new Error('Missing base PDF bytes');

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const outDoc = await PDFDocument.load(pdfBytes);

  const fontRegular = await outDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await outDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontMono = await outDoc.embedFont(StandardFonts.Courier);

  const pageCount = outDoc.getPageCount();
  const scale = Number(pageScale) > 0 ? Number(pageScale) : 1;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageNum = pageIndex + 1;
    const page = outDoc.getPage(pageIndex);
    const { height } = page.getSize();

    const pageSignatures = (signatures || []).filter((s) => s?.pageNum === pageNum);
    for (const sig of pageSignatures) {
      const x = (sig?.x || 0) / scale;
      const yTop = (sig?.y || 0) / scale;
      const w = (sig?.width || 180) / scale;
      const h = (sig?.height || 60) / scale;
      const y = height - yTop - h;

      if (sig?.dataUrl) {
        const decoded = decodeDataUrl(sig.dataUrl);
        if (decoded?.bytes) {
          const isPng = decoded.mimeType.includes('png');
          const img = isPng
            ? await outDoc.embedPng(decoded.bytes)
            : await outDoc.embedJpg(decoded.bytes);
          page.drawImage(img, { x, y, width: w, height: h, opacity: 1 });
          continue;
        }
      }

      const text = sanitizePdfText(sig?.text || 'Signature');
      page.drawText(text, {
        x: x + 2,
        y: y + Math.max(2, h * 0.35),
        size: Math.max(10, Math.min(24, h * 0.6)),
        font: fontItalic,
        color: rgb(0.12, 0.16, 0.23),
      });
    }

    const pageAnnotations = (annotations || []).filter((a) => a?.pageNum === pageNum);
    for (const ann of pageAnnotations) {
      const x = (ann?.x || 0) / scale;
      const yTop = (ann?.y || 0) / scale;

      if (ann?.type === 'image' && ann?.dataUrl) {
        const w = (ann?.width || 180) / scale;
        const h = (ann?.height || 120) / scale;
        const y = height - yTop - h;
        const decoded = decodeDataUrl(ann.dataUrl);
        if (decoded?.bytes) {
          const isPng = decoded.mimeType.includes('png');
          const img = isPng
            ? await outDoc.embedPng(decoded.bytes)
            : await outDoc.embedJpg(decoded.bytes);
          page.drawImage(img, { x, y, width: w, height: h, opacity: 1 });
        }
        continue;
      }

      if (ann?.type === 'checkmark') {
        const y = height - yTop - 18;
        page.drawText('X', { x, y, size: 18, font: fontRegular, color: rgb(0.08, 0.5, 0.23) });
        continue;
      }

      const text = sanitizePdfText(ann?.text || '');
      const fontSize = ann?.type === 'date' ? 11 : 12;
      const y = height - yTop - fontSize;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: ann?.type === 'text' ? fontMono : fontRegular,
        color: rgb(0.06, 0.09, 0.16),
      });
    }
  }

  return await outDoc.save();
};
