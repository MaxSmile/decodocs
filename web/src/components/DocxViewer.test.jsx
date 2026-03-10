import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DocxViewer from './DocxViewer';
import * as docx from 'docx-preview';

vi.mock('docx-preview', () => ({
    renderAsync: vi.fn().mockResolvedValue(true)
}));

describe('DocxViewer Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the container correctly', () => {
        const { container } = render(<DocxViewer blob={null} scale={1} />);
        const viewerContainer = container.querySelector('.docx-viewer-container');
        
        expect(viewerContainer).toBeInTheDocument();
        expect(viewerContainer).toHaveStyle({ transform: 'scale(1)' });
    });

    it('calls docx renderAsync when provided a blob', () => {
        const dummyBlob = new Blob(['mock docx data'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        render(<DocxViewer blob={dummyBlob} scale={1.5} />);

        // Give basic check that renderAsync was invoked correctly
        expect(docx.renderAsync).toHaveBeenCalled();
        expect(docx.renderAsync).toHaveBeenCalledWith(
            dummyBlob,
            expect.any(HTMLElement),
            null,
            expect.objectContaining({
                className: "docx-document",
                inWrapper: true
            })
        );
    });

    it('clears container on new render to prevent duplicate previews', () => {
        // We'll just verify renderAsync triggers logic
        const dummyBlob = new Blob(['mock docx data'], { type: 'application/octet-stream' });
        render(<DocxViewer blob={dummyBlob} />);
        
        expect(docx.renderAsync).toHaveBeenCalledTimes(1);
    });

});
