// import React, { useRef, useState } from 'react';
// import './UploadPage.css';

// function UploadPage() {
//   const fileInputRef = useRef(null);
//   const [uploadedImages, setUploadedImages] = useState([]);
//   const [uploadStatus, setUploadStatus] = useState(null);

//   // Function to trigger file selection on button click
//   const handleButtonClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   // Function to handle image file upload
//   const handleFileUpload = (e) => {
//     const files = Array.from(e.target.files);

//     // Process each uploaded file
//     files.forEach((file) => {
//       const reader = new FileReader();

//       // Read the file as data URL (for displaying images)
//       reader.readAsDataURL(file);

//       reader.onload = () => {
//         // Create container for image and input box
//         const container = document.createElement('div');
//         container.className = 'image-container';

//         // Display the uploaded image
//         const imageElement = document.createElement('img');
//         imageElement.src = reader.result;
//         imageElement.alt = file.name;
//         container.appendChild(imageElement);

//         // Create input box for changing file name
//         const input = document.createElement('input');
//         input.type = 'text';
//         const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
//         input.value = fileNameWithoutExtension; // Display filename without extension in the input box
//         input.className = 'file-name-input';
//         input.addEventListener('input', (event) => {
//           imageElement.alt = event.target.value + file.name.slice(file.name.lastIndexOf('.')); // Update alt attribute with the edited name and extension
//         });
//         container.appendChild(input);

//         document.getElementById('image-preview').appendChild(container);

//         console.log('Uploaded file:', file.name);

//         setUploadedImages((prevImages) => [...prevImages, file]);
//       };
//     });
//   };

//   const handleSubmit = () => {
//     // Submit only if there are uploaded images
//     if (uploadedImages.length > 0) {
//       const formData = new FormData();
//       uploadedImages.forEach((file) => {
//         formData.append('file', file);
//         formData.append('updatedName', file.name.replace(/\.[^/.]+$/, '')); // Remove file extension from the name
//       });

//       // Here, you can add code to upload the files to the backend
//       fetch('http://127.0.0.1:5000/upload', {
//         method: 'POST',
//         body: formData,
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           // Handle response from the server if needed
//           console.log('Server response:', data);
//           if (data.success) {
//             setUploadStatus('Images uploaded successfully!');
//           } else {
//             setUploadStatus('Upload failed. Please try again.');
//           }
//         })
//         .catch((error) => {
//           // Handle errors
//           console.error('Error:', error);
//           setUploadStatus('An error occurred during upload.');
//         });
//     } else {
//       // No uploaded images, prevent form submission
//       console.warn('No images uploaded');
//       setUploadStatus('No images uploaded');
//     }
//   };

//   return (
//     <div className="upload-container">
//       <h2>Upload Student Images</h2>
//       <div className="upload-area">
//         <div id="image-preview" className="image-preview">
//           {/* Uploaded images will be displayed here */}
//         </div>
//         <input
//           type="file"
//           onChange={handleFileUpload}
//           accept="image/*" // Accept only image files
//           multiple
//           ref={fileInputRef} // Reference for the file input element
//           style={{ display: 'none' }} // Hide the file input
//         />
//         <button onClick={handleButtonClick} className="upload-button">
//           Select Images
//         </button>
//         <p>Upload student images (file name as student name)</p>
//         <button onClick={handleSubmit} className="submit-button">
//           Submit
//         </button>
//         {uploadStatus && <p>{uploadStatus}</p>}
//       </div>
//     </div>
//   );
// }

// export default UploadPage;

import React, { useRef, useState } from 'react';
import './UploadPage.css';

function UploadPage() {
  const fileInputRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Function to trigger file selection on button click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle image file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    // Update state with new files, ensuring previous state is maintained
    setUploadedImages(prevImages => [...prevImages, ...files.map(file => ({ file, newName: file.name.replace(/\.[^/.]+$/, '') }))]);
  };

  // Function to handle file renaming
  const handleRenameFile = (index, newName) => {
    setUploadedImages(prevImages => prevImages.map((img, i) => i === index ? { ...img, newName } : img));
  };

  // Function to remove an image from the list
  const handleRemoveImage = (index) => {
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Submit only if there are uploaded images
    if (uploadedImages.length > 0) {
      const formData = new FormData();
      uploadedImages.forEach(({ file, newName }) => {
        formData.append('file', file);
        formData.append('updatedName', newName + file.name.slice(file.name.lastIndexOf('.'))); // Append the extension to the updated name
      });

      // Here, you can add code to upload the files to the backend
      fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Handle response from the server if needed
          console.log('Server response:', data);
          if (data.success) {
            setUploadStatus('Images uploaded successfully!');
            setUploadedImages([]); // Clear the uploaded images
          } else {
            setUploadStatus('Upload failed. Please try again.');
          }
        })
        .catch((error) => {
          // Handle errors
          console.error('Error:', error);
          setUploadStatus('An error occurred during upload.');
        });
    } else {
      // No uploaded images, prevent form submission
      console.warn('No images uploaded');
      setUploadStatus('No images uploaded');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Student Images</h2>
      <div className="upload-area">
        <div id="image-preview" className="image-preview">
          {uploadedImages.map((img, index) => (
            <div key={index} className="image-container">
              <img src={URL.createObjectURL(img.file)} alt={img.newName} />
              <input
                type="text"
                value={img.newName}
                onChange={(e) => handleRenameFile(index, e.target.value)}
                className="file-name-input"
              />
              <button onClick={() => handleRemoveImage(index)} className="remove-image-button">
                Remove
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          onChange={handleFileUpload}
          accept="image/*" // Accept only image files
          multiple
          ref={fileInputRef} // Reference for the file input element
          style={{ display: 'none' }} // Hide the file input
        />
        <button onClick={handleButtonClick} className="upload-button">
          Select Images
        </button>
        <p>Upload student images (file name as student name)</p>
        <button onClick={handleSubmit} className="submit-button">
          Submit
        </button>
        {uploadStatus && <p>{uploadStatus}</p>}
      </div>
    </div>
  );
}

export default UploadPage;

