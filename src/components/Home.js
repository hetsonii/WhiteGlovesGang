import React, { useRef, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import studentsData from "../data/students.js";
import attendanceData from "../data/attendance.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from 'react-router-dom';
import Topbar from "./Topbar";
import "./Home.css";

function Home() {
  const [studentData, setStudentData] = useState(studentsData); // Change the state variable name
  const [presentStudents, setPresentStudents] = useState([]);
  const [remainingStudents, setRemainingStudents] = useState(studentData);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudentData, setSelectedStudentData] = useState(null);

  const [webcamOn, setWebcamOn] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();

  const handleSubmit = () => {
    const attendanceData = {
      presentStudents,
      selectedStudentData,
    };
    navigate('/review', { state: attendanceData });
  };

  const toggleWebcam = () => {
    setWebcamOn(!webcamOn);
    setIsButtonDisabled(true);
    setProgress(0);

    // Disable the button for 3 seconds
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 3000);

    // logic to call your Flask API endpoint to release the webcam
    fetch('http://127.0.0.1:5000/release_webcam')
      .then(response => response.text())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  };

  const handleClassChange = (event) => {
    const className = event.target.value;
    setSelectedClass(className);
    setSelectedBatch(null);
    setSelectedStudentData({});
  };

  const handleBatchChange = (event) => {
    const batch = event.target.value;
    setSelectedBatch(batch);
    const studentData = studentsData[0][selectedClass][batch];
    setSelectedStudentData(studentData);
  };


  useEffect(() => {
    if (selectedClass && selectedBatch) {
      const attendanceList = attendanceData.map(item => item.name);
      const presentStudents = [];
      const updatedSelectedStudentData = { ...selectedStudentData };

      for (const [key, value] of Object.entries(studentsData[0][selectedClass][selectedBatch])) {
        if (attendanceList.includes(key) || attendanceList.includes(value)) {
          presentStudents.push({ rollNumber: key, name: value });
          // Remove the key-value pair from selectedStudentData
          delete updatedSelectedStudentData[key];
        }
      }

      setPresentStudents(presentStudents);
      setSelectedStudentData(updatedSelectedStudentData);
    }
  }, [selectedClass, selectedBatch, selectedStudentData]);


  useEffect(() => {
    let interval;

    if (isButtonDisabled) {
      interval = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress + (100 / 3000) * 100; // 3000 milliseconds for 100% progress
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isButtonDisabled]);


  return (
    <div>
      <Topbar />
      <div className="flex">
        <div className="sidebar">
          <h2 className="sidebar-title">Absentees/Invited</h2>
          <div className="input-fields">
            <select value={selectedClass || ''} onChange={handleClassChange}>
              <option value="">Select a Class</option>
              {Object.keys(studentsData[0]).map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            {selectedClass && (
              <div>
                <select value={selectedBatch || ''} onChange={handleBatchChange}>
                  <option value="">Select a Batch</option>
                  {Object.keys(studentsData[0][selectedClass]).map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <br />

          </div>
          <Sidebar data={selectedStudentData || {}} />
        </div>

        <div className="webcam-container">
          {selectedClass && selectedBatch && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
              }}
            >
              {webcamOn ? (
                <img className="webcam" src={`http://127.0.0.1:5000/video_feed?class=${selectedClass}&batch=${selectedBatch}`} />
              ) : (
                <div className="text-center">Webcam is off</div>
              )}
            </div>
          )}

          {selectedClass && selectedBatch && (
            <>
              {selectedClass && selectedBatch && (
                <button
                  onClick={toggleWebcam}
                  className={`custom-button ${webcamOn ? 'webcam-on' : 'webcam-off'} ${isButtonDisabled ? 'disabled' : ''}`}
                  disabled={isButtonDisabled}
                >
                  <FontAwesomeIcon icon={webcamOn ? faVideo : faVideoSlash} />
                  {webcamOn ? ' Turn Off Webcam' : ' Turn On Webcam'}
                </button>
              )}
            </>
          )}

        </div>

        <div className="sidebar present-sidebar">
          <h2 className="sidebar-title">Present</h2>
          {presentStudents.map((student, index) => (
            <div key={index} className="present-student">
              {student.rollNumber} - {student.name}
            </div>
          ))}
          <button className='submit-button' type='submit' onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
