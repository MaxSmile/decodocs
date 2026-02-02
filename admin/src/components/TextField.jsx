import React from 'react';

export default function TextField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label style={{ display: 'block', marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          marginTop: 6,
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          outline: 'none',
          fontSize: 14,
        }}
      />
    </label>
  );
}
