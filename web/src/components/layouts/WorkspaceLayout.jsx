import React from 'react';

import WebAppLayout from './WebAppLayout.jsx';

const WorkspaceLayout = ({ children }) => {
  return (
    <WebAppLayout showFooter={false}>
      {children}
    </WebAppLayout>
  );
};

export default WorkspaceLayout;
