import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import Home from './components/Home';
import Reviewattendance from './components/Reviewattendance';


function App() {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Home />} /> 
        <Route path="/page1" element={<Reviewattendance />} /> 
      </Routes> 
    </Router>
  );
}


export default App;
