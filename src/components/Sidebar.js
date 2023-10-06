import React from 'react';
import './Sidebar.css';

function Sidebar({ data }) {
  return (
    <div className="student-list">
      <h2>Student List</h2>
      <ul>
        {data.map((student, index) => (
          <li
            key={index}
            className={`student ${student.present ? 'present' : 'absent'}`}
          >
            <span>{student.rollNumber} -</span> {student.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
