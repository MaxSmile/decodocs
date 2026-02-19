import React from 'react';

import Layout from '../Layout.jsx';

const PublicLayout = ({ children, showOneTap = false, showDecor = false, onOpenPdf }) => {
  return (
    <Layout
      variant="marketing"
      showHeader
      showFooter
      showOneTap={showOneTap}
      showDecor={showDecor}
      onOpenPdf={onOpenPdf}
    >
      {children}
    </Layout>
  );
};

export default PublicLayout;
