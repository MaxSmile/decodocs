import { buildDocStats } from './docStats';

/**
 * Extracts raw text from a DOCX array buffer.
 * @param {ArrayBuffer} arrayBuffer The DOCX file content.
 * @returns {Promise<string>} The extracted text.
 */
export const extractDocxText = async (arrayBuffer) => {
    try {
        // Dynamically import mammoth to split the bundle map and reduce initial load footprint
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        throw error;
    }
};
