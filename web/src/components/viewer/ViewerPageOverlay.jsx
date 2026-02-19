import React from 'react';

const ViewerPageOverlay = ({ pageNum, signatures, annotations }) => (
  <>
    {signatures.filter((signature) => signature.pageNum === pageNum).map((signature) => (
      <div
        key={signature.id}
        className="absolute border-2 border-blue-500/40 bg-blue-50/20 flex items-center justify-center cursor-move rounded"
        style={{ left: signature.x, top: signature.y, width: signature.width, height: signature.height, zIndex: 50 }}
        onClick={(event) => event.stopPropagation()}
      >
        {signature.mode === 'type' ? (
          <span
            className="text-slate-900 select-none"
            style={{ fontFamily: signature.fontFamily, fontSize: '1.5rem', lineHeight: 1 }}
          >
            {signature.text}
          </span>
        ) : signature.dataUrl ? (
          <img src={signature.dataUrl} alt="Signature" className="max-w-full max-h-full object-contain" draggable={false} />
        ) : (
          <span className="text-blue-700 font-semibold italic text-lg">Signature</span>
        )}
      </div>
    ))}
    {annotations.filter((annotation) => annotation.pageNum === pageNum).map((annotation) => (
      <div
        key={annotation.id}
        className={`absolute px-2 py-1 text-sm shadow-sm cursor-move rounded ${
          annotation.type === 'checkmark'
            ? 'text-green-700 text-2xl font-bold'
            : annotation.type === 'date'
              ? 'bg-amber-50 border border-amber-300 text-amber-800'
              : annotation.type === 'image'
                ? 'bg-purple-50 border border-purple-300 text-purple-700'
                : 'bg-yellow-100 border border-yellow-300 text-slate-800'
        }`}
        style={{ left: annotation.x, top: annotation.y, zIndex: 50 }}
        onClick={(event) => event.stopPropagation()}
      >
        {annotation.text}
      </div>
    ))}
  </>
);

export default ViewerPageOverlay;
