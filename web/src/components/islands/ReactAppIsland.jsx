import React from 'react';
import SupportUkraineBanner from 'react-support-ukraine-banner';
import App from '../../App.jsx';

const ReactAppIsland = ({ basename = '/' }) => {
  return (
    <>
      <SupportUkraineBanner />
      <App basename={basename} />
    </>
  );
};

export default ReactAppIsland;
