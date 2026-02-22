import React from 'react';

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
          }}
          onClick={(event) => { event.stopPropagation(); onSelect && onSelect(signature.id); }}
          onMouseDown={(e) => onStartDrag && onStartDrag(e, signature, 'signature')}
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
          className={`absolute px-2 py-1 text-sm shadow-sm cursor-move rounded select-none ${selectedItemId === annotation.id ? 'ring-2 ring-blue-400' : ''} ${annotation.type === 'checkmark' ? 'text-green-700 text-2xl font-bold' : annotation.type === 'date' ? 'bg-amber-50 border border-amber-300 text-amber-800' : annotation.type === 'image' ? 'bg-purple-50 border border-purple-300 text-purple-700' : 'bg-yellow-100 border border-yellow-300 text-slate-800'}`}
          style={{ left: annotation.x, top: annotation.y, zIndex: 50 }}
          onClick={(event) => { event.stopPropagation(); onSelect && onSelect(annotation.id); }}
          onMouseDown={(e) => onStartDrag && onStartDrag(e, annotation, 'annotation')}
        >
          {annotation.text}
        </div>
      ))}
  </>
);

export default EditorOverlay;
