import React from 'react';

import Layout from '../Layout.jsx';

const AuthLayout = ({ children }) => {
  return (
    <Layout variant="marketing" showHeader showFooter>
      {children}
    </Layout>
  );
};

export default AuthLayout;
