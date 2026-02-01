export function buildDocStats({ pageCount, extractedText, pdfSizeBytes }) {
  const text = String(extractedText || '');
  const pages = text.split('\f').filter((p) => p !== undefined);
  const charsPerPage = pages.slice(0, pageCount).map((p) => String(p || '').trim().length);

  return {
    pageCount,
    charsPerPage,
    totalChars: text.replace(/\f/g, '').length,
    pdfSizeBytes: pdfSizeBytes || 0,
  };
}
