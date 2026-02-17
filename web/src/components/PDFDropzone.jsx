import React, { useRef, useState } from 'react';
import { HiCloudUpload, HiDocumentAdd } from 'react-icons/hi';

const PDFDropzone = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Mock an event object to reuse the handler
            onFileSelect({ target: { files: e.dataTransfer.files } });
        }
    };

    return (
        <div
            className={`flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-96 border-2 border-dashed rounded-3xl transition-all duration-300 ${isDragging
                    ? 'border-blue-500 bg-blue-50/50 scale-105 shadow-xl'
                    : 'border-slate-300 bg-white/50 hover:border-blue-400 hover:bg-slate-50'
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`p-6 rounded-full mb-6 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <HiCloudUpload className="w-16 h-16" />
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Upload a PDF or .snapsign file
            </h3>

            <p className="text-slate-500 mb-8 text-center max-w-md px-4">
                Drag and drop your file here, or click the button below to browse your computer.
            </p>

            <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-3"
            >
                <HiDocumentAdd className="w-6 h-6" />
                Choose File
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelect}
                accept=".pdf,.snapsign,application/pdf,application/zip"
                className="hidden"
            />
        </div>
    );
};

export default PDFDropzone;
