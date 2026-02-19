import React from 'react';

import Layout from '../Layout.jsx';

const WebAppLayout = ({ children, showFooter = true }) => {
  return (
    <Layout variant="app" showHeader showFooter={showFooter}>
      {children}
    </Layout>
  );
};

export default WebAppLayout;
