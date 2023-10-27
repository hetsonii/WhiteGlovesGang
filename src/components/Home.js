import React, { useRef, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import studentsData from "../data/students.js"; // Change the name of imported data
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import Topbar from "./Topbar";
import "./Home.css";

function Home() {
  const [studentData, setStudentData] = useState(studentsData); // Change the state variable name
  const [webcamOn, setWebcamOn] = useState(true);
  const [presentStudents, setPresentStudents] = useState([]);
  const [remainingStudents, setRemainingStudents] = useState(studentData);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudentData, setSelectedStudentData] = useState(null);


  const toggleWebcam = () => {
    setWebcamOn((prevWebcamOn) => !prevWebcamOn);
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            {webcamOn ? (
              <img className="webcam" src="http://127.0.0.1:5000/video_feed" />
            ) : (
              <div className="text-center">Webcam is off</div>
            )}
          </div>
          <button
            onClick={toggleWebcam}
            className={`custom-button ${webcamOn ? "webcam-on" : "webcam-off"
              }`}
          >
            <FontAwesomeIcon
              icon={webcamOn ? faVideo : faVideoSlash}
            />
            {webcamOn ? "Turn Off Webcam" : "Turn On Webcam"}
          </button>
        </div>
        <div className="sidebar present-sidebar">
          <h2 className="sidebar-title">Present</h2>
          {presentStudents.map((student, index) => (
            <div key={index} className="present-student">
              {student.rollNumber} - {student.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
