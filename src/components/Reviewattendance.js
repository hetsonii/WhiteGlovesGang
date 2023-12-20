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

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/submit-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Attendance submitted successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
    }
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
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default Reviewattendance;
