import React from 'react';

export default function Button({ children, onClick, disabled, variant = 'primary', type = 'button' }) {
  const styles =
    variant === 'primary'
      ? { background: '#0f172a', color: 'white', border: '1px solid #0f172a' }
      : { background: 'white', color: '#0f172a', border: '1px solid #cbd5e1' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles,
        width: '100%',
        borderRadius: 12,
        padding: '10px 12px',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
