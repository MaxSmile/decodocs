import React from 'react';

const EditorOverlay = ({ pageNum, signatures, annotations }) => (
  <>
    {signatures
      .filter((signature) => signature.pageNum === pageNum)
      .map((signature) => (
        <div
          key={signature.id}
          className="absolute border-2 border-blue-500 bg-blue-50/20 flex items-center justify-center cursor-move"
          style={{
            left: signature.x,
            top: signature.y,
            width: signature.width,
            height: signature.height,
            zIndex: 50,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="text-blue-700 font-script text-xl font-bold">{signature.text}</span>
        </div>
      ))}
    {annotations
      .filter((annotation) => annotation.pageNum === pageNum)
      .map((annotation) => (
        <div
          key={annotation.id}
          className="absolute bg-yellow-100 border border-yellow-300 px-2 py-1 text-sm shadow-sm cursor-move"
          style={{ left: annotation.x, top: annotation.y, zIndex: 50 }}
          onClick={(event) => event.stopPropagation()}
        >
          {annotation.text}
        </div>
      ))}
  </>
);

export default EditorOverlay;
