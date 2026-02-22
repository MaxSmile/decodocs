import React from 'react';
import App from '../../App.jsx';

const ReactAppIsland = ({ basename = '/' }) => {
  return <App basename={basename} />;
};

export default ReactAppIsland;
