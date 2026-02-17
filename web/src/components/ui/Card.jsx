import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`dd-card ${className}`}>
      {children}
    </div>
  );
};

export default Card;
