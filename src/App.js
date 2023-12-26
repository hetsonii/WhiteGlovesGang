import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import Home from './components/Home';
import Reviewattendance from './components/Reviewattendance';
import UploadPage from './components/UploadPage';


function App() {
  return (
    <Router>
      <Routes> 
        <Route path="/" element={<Home />} /> 
        <Route path="/review" element={<Reviewattendance />} /> 
        <Route path="/upload" element={<UploadPage/>} />
      </Routes> 
    </Router>
  );
}


export default App;
