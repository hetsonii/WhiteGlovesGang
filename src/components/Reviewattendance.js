import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Reviewattendance.css'; 

function Reviewattendance() {
  const [absentStudents, setAbsentStudents] = useState([]);

  const location = useLocation();
  const { presentStudents, selectedStudentData } = location.state;

  const handleAbsentStudentData = (selectedStudentData) => {
    const updatedSelectedStudentData = [];

    for (const [key, value] of Object.entries(selectedStudentData)) {
      updatedSelectedStudentData.push({ rollNumber: key, name: value });
    }

    setAbsentStudents(updatedSelectedStudentData);
  }

  useEffect(() => {
    if (selectedStudentData) {
      handleAbsentStudentData(selectedStudentData);
    }
  }, [selectedStudentData]);

  return (
    <div className="page-container">
      <div className="attendance-box">
        <h2>Present Students</h2>
        <div className="students-container">
          {presentStudents && presentStudents.map((student, index) => (
            <div key={index} className="present-student">
              {student.rollNumber} - {student.name}
            </div>
          ))}
        </div>

        <h2>Absent Students</h2>
        <div className="students-container">
          {absentStudents && absentStudents.map((student, index) => (
            <div key={index} className="absent-student">
              {student.rollNumber} - {student.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reviewattendance;
