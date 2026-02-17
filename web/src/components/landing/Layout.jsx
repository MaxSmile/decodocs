import React from 'react';

import Layout from '../Layout.jsx';

const LandingLayout = ({ onOpenPdf = () => {}, children }) => {
  return (
    <Layout showHeader showFooter showOneTap showDecor onOpenPdf={onOpenPdf}>
      {children}
    </Layout>
  );
};

export default LandingLayout;
