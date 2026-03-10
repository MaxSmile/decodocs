import { describe, it, expect, vi } from 'vitest';
import { extractDocxText } from './docxUtils';

// Mock the dynamic import of mammoth
vi.mock('mammoth', () => ({
    default: {
        extractRawText: vi.fn().mockResolvedValue({ value: 'Mocked DOCX content' })
    },
    extractRawText: vi.fn().mockResolvedValue({ value: 'Mocked DOCX content' })
}));

describe('docxUtils.extractDocxText', () => {
    it('successfully extracts text from an ArrayBuffer', async () => {
        const dummyBuffer = new ArrayBuffer(8);
        const result = await extractDocxText(dummyBuffer);
        expect(result).toBe('Mocked DOCX content');
    });

    it('propagates errors when extraction fails', async () => {
        // Override mock for this specific test
        const mammothMock = await import('mammoth');
        mammothMock.default.extractRawText.mockRejectedValueOnce(new Error('Extraction failed'));
        
        const dummyBuffer = new ArrayBuffer(8);
        await expect(extractDocxText(dummyBuffer)).rejects.toThrow('Extraction failed');
    });
});
