import React, { useRef, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import studentsData from "../data/students.js"; // Change the name of imported data
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import Topbar from "./Topbar";
import "./Home.css";

function Home() {
  const webcamRef = useRef(null);
  const [studentData, setStudentData] = useState(studentsData); // Change the state variable name
  const [webcamOn, setWebcamOn] = useState(true);
  const [presentStudents, setPresentStudents] = useState([]);
  const [remainingStudents, setRemainingStudents] = useState(studentData);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudentData, setSelectedStudentData] = useState(null);

  // Update the addStudentToPresent function to use the filtered data
  // const addStudentToPresent = () => {
  //   if (remainingStudents.length > 0) {
  //     const [studentToAdd, ...restStudents] = remainingStudents;
  //     // Check if the student's presence status is false, then set it to true
  //     if (!studentToAdd.present) {
  //       const updatedStudent = { ...studentToAdd, present: true };
  //       setStudentData((prevStudentData) => {
  //         const updatedData = prevStudentData.map((student) =>
  //           student.rollNumber === studentToAdd.rollNumber ? updatedStudent : student
  //         );
  //         return updatedData;
  //       });
  //     }
  //     setPresentStudents((prevPresentStudents) => [
  //       ...prevPresentStudents,
  //       studentToAdd,
  //     ]);
  //     setRemainingStudents(restStudents);
  //   }
  // };


  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     addStudentToPresent();
  //     console.log(studentData);
  //   }, 4000); // Add a student every 4 seconds

  //   return () => clearInterval(interval);
  // }, [remainingStudents]);

  useEffect(() => {
    async function getCameraStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (webcamRef.current) {
          webcamRef.current.stream = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }

    if (webcamOn) {
      getCameraStream();
    } else {
      if (webcamRef.current) {
        webcamRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [webcamOn]);

  const toggleWebcam = () => {
    setWebcamOn((prevWebcamOn) => !prevWebcamOn);
  };

  const handleClassChange = (event) => {
    const className = event.target.value;
    setSelectedClass(className);
    setSelectedBatch(null); // Reset batch selection
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
              // <Webcam
              //   audio={false}
              //   mirrored={true}
              //   ref={webcamRef}
              //   screenshotFormat="image/jpeg"
              //   className="webcam"
              // />
              <img src="http://127.0.0.1:5000/video_feed" />
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
