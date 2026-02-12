import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HiX, HiPencil, HiDocumentText, HiPhotograph, HiTrash } from 'react-icons/hi';

/* ── Signature font families (bundled via Google Fonts at runtime) ── */
const SIGNATURE_FONTS = [
  { id: 'dancing-script', label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { id: 'great-vibes', label: 'Great Vibes', family: "'Great Vibes', cursive" },
  { id: 'allura', label: 'Allura', family: "'Allura', cursive" },
  { id: 'parisienne', label: 'Parisienne', family: "'Parisienne', cursive" },
  { id: 'sacramento', label: 'Sacramento', family: "'Sacramento', cursive" },
  { id: 'alex-brush', label: 'Alex Brush', family: "'Alex Brush', cursive" },
];

/* Load Google Fonts dynamically (only once) */
let fontsLoaded = false;
function ensureFontsLoaded() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const families = SIGNATURE_FONTS.map((f) => f.label.replace(/ /g, '+')).join('&family=');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
}

function buildTypeSignatureDraft({ displayName, font }) {
  return {
    version: 1,
    kind: 'type',
    displayName,
    fontId: font.id,
    fontFamily: font.family,
    createdAt: new Date().toISOString(),
  };
}

/* ────────────────────────────────────────────────────────────────────
   TAB: Draw
   ──────────────────────────────────────────────────────────────────── */
const DrawTab = ({ onResult }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const startDraw = useCallback((e) => {
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  }, [isDrawing]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasContent(false);
    onResult(null);
  };

  const handleAdopt = () => {
    if (!hasContent) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onResult({
      mode: 'draw',
      dataUrl,
      width: 200,
      height: 60,
      persistence: {
        kind: 'ephemeral-data-url',
        canPersist: false,
        reason: 'free-tier-no-server-storage',
      },
    });
  };

  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative border border-slate-200 rounded-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={440}
          height={140}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm pointer-events-none select-none">
            Draw your signature here
          </div>
        )}
        {/* baseline guide */}
        <div className="absolute bottom-8 left-4 right-4 border-b border-dashed border-slate-200 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={clear}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <HiTrash className="w-3.5 h-3.5" /> Clear
        </button>
        <button
          onClick={handleAdopt}
          disabled={!hasContent}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Adopt signature
        </button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────
   TAB: Type
   ──────────────────────────────────────────────────────────────────── */
const TypeTab = ({ onResult }) => {
  const [name, setName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  const handleAdopt = () => {
    if (!name.trim()) return;
    const displayName = name.trim();
    onResult({
      mode: 'type',
      text: displayName,
      fontFamily: selectedFont.family,
      fontId: selectedFont.id,
      width: 200,
      height: 50,
      persistence: {
        kind: 'candidate-profile',
        canPersist: true,
        target: 'firestore-signature-profiles',
      },
      profileDraft: buildTypeSignatureDraft({ displayName, font: selectedFont }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Preview */}
      <div className="border border-slate-200 rounded-lg bg-white p-6 min-h-[90px] flex items-center justify-center">
        {name.trim() ? (
          <span
            className="text-3xl text-slate-800 select-none"
            style={{ fontFamily: selectedFont.family }}
          >
            {name}
          </span>
        ) : (
          <span className="text-slate-300 text-sm">Preview</span>
        )}
      </div>

      {/* Font picker */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Style</label>
        <div className="grid grid-cols-3 gap-2">
          {SIGNATURE_FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => setSelectedFont(font)}
              className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                selectedFont.id === font.id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span
                className="text-lg text-slate-700 block truncate"
                style={{ fontFamily: font.family }}
              >
                {name.trim() || 'Signature'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{font.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAdopt}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Adopt signature
        </button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────
   TAB: Upload
   ──────────────────────────────────────────────────────────────────── */
const UploadTab = ({ onResult }) => {
  const [preview, setPreview] = useState(null);
  const [uploadMeta, setUploadMeta] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setUploadMeta({
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size || null,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAdopt = () => {
    if (!preview) return;
    onResult({
      mode: 'upload',
      dataUrl: preview,
      width: 200,
      height: 60,
      uploadMeta,
      persistence: {
        kind: 'ephemeral-data-url',
        canPersist: false,
        reason: 'free-tier-no-server-storage',
      },
    });
  };

  const clear = () => {
    setPreview(null);
    setUploadMeta(null);
    if (inputRef.current) inputRef.current.value = '';
    onResult(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        <div className="border border-slate-200 rounded-lg bg-white p-4 flex items-center justify-center min-h-[140px]">
          <img src={preview} alt="Signature" className="max-h-[120px] max-w-full object-contain" />
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 p-8 flex flex-col items-center gap-2 transition-colors cursor-pointer"
        >
          <HiPhotograph className="w-8 h-8 text-slate-400" />
          <span className="text-sm text-slate-500">Click to upload signature image</span>
          <span className="text-[10px] text-slate-400">PNG, JPG, or SVG — transparent background recommended</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        {preview && (
          <button
            onClick={clear}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <HiTrash className="w-3.5 h-3.5" /> Remove
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={handleAdopt}
          disabled={!preview}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Adopt signature
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   MAIN MODAL
   ════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'draw', label: 'Draw', icon: HiPencil },
  { id: 'type', label: 'Type', icon: HiDocumentText },
  { id: 'upload', label: 'Upload', icon: HiPhotograph },
];

/**
 * SignatureModal
 *
 * Props:
 *  - open:       boolean
 *  - onClose:    () => void
 *  - onAdopt:    (signatureData) => void   — called when user approves a signature
 *  - savedSignatures: array               — previously saved signatures (future)
 */
const SignatureModal = ({ open, onClose, onAdopt, savedSignatures = [] }) => {
  const [activeTab, setActiveTab] = useState('draw');

  if (!open) return null;

  const handleResult = (data) => {
    if (!data) return;
    onAdopt(data);
    onClose();
  };

  return (
    <div
      id="signature-modal-backdrop"
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] p-4"
      onClick={onClose}
    >
      <div
        id="signature-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Create your signature</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scope note */}
        <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          Self-sign only in this version. No multi-party recipients, signee roles, or signing order are supported.
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'draw' && <DrawTab onResult={handleResult} />}
          {activeTab === 'type' && <TypeTab onResult={handleResult} />}
          {activeTab === 'upload' && <UploadTab onResult={handleResult} />}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-4 text-[11px] text-slate-400 leading-snug">
          Consent: By adopting this signature, you confirm this is for your own self-sign use and that you are authorized to create and apply it.
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
