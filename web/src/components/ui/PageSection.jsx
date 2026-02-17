import React from 'react';

const sizeClasses = {
  md: 'dd-page-md',
  lg: 'dd-page-lg',
  xl: 'dd-page-xl',
};

const PageSection = ({ children, size = 'lg', className = '' }) => {
  const sizeClass = sizeClasses[size] || sizeClasses.lg;
  return (
    <section className={`dd-page ${sizeClass} ${className}`}>
      {children}
    </section>
  );
};

export default PageSection;
