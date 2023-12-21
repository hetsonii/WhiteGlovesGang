import React from 'react';
import { Link } from 'react-router-dom';
import './Topbar.css'; 

function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar-container">
        <h1 className="topbar-title">Attendance</h1>
        <nav className="topbar-nav">
          <Link to="/" className="topbar-link">Dashboard</Link>
          <Link to="/page1" className="topbar-link">Page 1</Link>
          <Link to="/upload" className="topbar-link">Upload</Link>
        </nav>
      </div>
    </div>
  );
}

export default Topbar;
