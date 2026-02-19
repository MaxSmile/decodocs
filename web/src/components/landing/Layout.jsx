import React from 'react';

import PublicLayout from '../layouts/PublicLayout.jsx';

const LandingLayout = ({ onOpenPdf = () => {}, children }) => {
  return (
    <PublicLayout showOneTap showDecor onOpenPdf={onOpenPdf}>
      {children}
    </PublicLayout>
  );
};

export default LandingLayout;
