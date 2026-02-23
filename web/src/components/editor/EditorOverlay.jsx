import React from 'react';

const ImageAnnotation = ({ annotation }) => {
  const width = Number(annotation?.width) > 0 ? Number(annotation.width) : 180;
  const height = Number(annotation?.height) > 0 ? Number(annotation.height) : 120;
  const src = annotation?.dataUrl || '';

  return (
    <div className="w-full h-full flex items-center justify-center bg-white/60">
      {src ? (
        <img
          src={src}
          alt={annotation?.text || 'Image'}
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />
      ) : (
        <span className="text-purple-700 text-xs font-semibold pointer-events-none">Image</span>
      )}
    </div>
  );
};

const EditorOverlay = ({ pageNum, signatures, annotations, selectedItemId, onStartDrag, onSelect }) => (
  <>
    {signatures
      .filter((signature) => signature.pageNum === pageNum)
      .map((signature) => (
        <div
          key={signature.id}
          data-testid={`overlay-signature-${signature.id}`}
          className={`absolute border-2 ${selectedItemId === signature.id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-blue-500/40'} bg-blue-50/20 flex items-center justify-center cursor-move rounded select-none`}
          style={{
            left: signature.x,
            top: signature.y,
            width: signature.width,
            height: signature.height,
            zIndex: 50,
            touchAction: 'none',
          }}
          onClick={(event) => { event.stopPropagation(); onSelect && onSelect(signature.id); }}
          onMouseDown={(e) => {
            if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
            onStartDrag && onStartDrag(e, signature, 'signature');
          }}
          onPointerDown={(e) => onStartDrag && onStartDrag(e, signature, 'signature')}
        >
          <span className="text-blue-700 font-script text-xl font-bold pointer-events-none">{signature.text}</span>
        </div>
      ))}
    {annotations
      .filter((annotation) => annotation.pageNum === pageNum)
      .map((annotation) => (
        <div
          key={annotation.id}
          data-testid={`overlay-annotation-${annotation.id}`}
          className={`absolute shadow-sm cursor-move rounded select-none overflow-hidden ${
            selectedItemId === annotation.id ? 'ring-2 ring-blue-400' : ''
          } ${
            annotation.type === 'checkmark'
              ? 'px-2 py-1 text-green-700 text-2xl font-bold'
              : annotation.type === 'date'
                ? 'px-2 py-1 bg-amber-50 border border-amber-300 text-amber-800'
                : annotation.type === 'image'
                  ? 'border border-purple-300 bg-purple-50/30'
                  : 'px-2 py-1 bg-yellow-100 border border-yellow-300 text-slate-800'
          }`}
          style={{
            left: annotation.x,
            top: annotation.y,
            zIndex: 50,
            touchAction: 'none',
            width: annotation.type === 'image' ? (annotation.width || 180) : undefined,
            height: annotation.type === 'image' ? (annotation.height || 120) : undefined,
          }}
          onClick={(event) => { event.stopPropagation(); onSelect && onSelect(annotation.id); }}
          onMouseDown={(e) => {
            if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
            onStartDrag && onStartDrag(e, annotation, 'annotation');
          }}
          onPointerDown={(e) => onStartDrag && onStartDrag(e, annotation, 'annotation')}
        >
          {annotation.type === 'image' ? <ImageAnnotation annotation={annotation} /> : annotation.text}
        </div>
      ))}
  </>
);

export default EditorOverlay;
