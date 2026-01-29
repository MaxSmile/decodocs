import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ViewDocument from './pages/ViewDocument';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/view/:documentId" element={<ViewDocument />} />
          <Route path="/view" element={<ViewDocument />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;