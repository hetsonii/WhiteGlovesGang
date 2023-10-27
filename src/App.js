import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import Home from './components/Home';


function App() {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Home />} /> 
      </Routes> 
    </Router>
  );
}


export default App;
