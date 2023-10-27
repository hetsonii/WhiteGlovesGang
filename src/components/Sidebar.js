import React from 'react';
import './Sidebar.css';


function Sidebar({ data }) {
  return (
    <div className="studentBox">

      <h2>Student List</h2>
      <ul className="studentsList">
        {Object.entries(data).map(([studentId, studentName]) => (
          <li className='student' key={studentId}>
            {studentId}: {studentName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
