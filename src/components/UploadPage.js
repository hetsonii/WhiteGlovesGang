import React, { useRef, useState } from 'react';
import './UploadPage.css';

function UploadPage() {
  const fileInputRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadStatus('');

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (readEvent) => {
        setUploadedImages((prevImages) => [
          ...prevImages,
          { id: Date.now() + Math.random(), name: file.name, dataUrl: readEvent.target.result }
        ]);
      };

      reader.onerror = () => {
        console.error('Error reading file.');
        setUploadStatus('Error reading file.');
      };

      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleImageDelete = (imageId) => {
    setUploadedImages((prevImages) =>
      prevImages.filter((image) => image.id !== imageId)
    );
  };

  const handleImageNameChange = (event, imageId) => {
    const newName = event.target.value;
    setUploadedImages((prevImages) =>
      prevImages.map((image) =>
        image.id === imageId ? { ...image, name: newName } : image
      )
    );
  };

  const handleSubmit = () => {
    if (uploadedImages.length > 0) {
      // Implement upload logic here
    } else {
      setUploadStatus('No images to upload.');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Student Images</h2>
      <div className="upload-area">
        <div className="image-preview">
          {uploadedImages.map((image) => (
            <div key={image.id} className="image-container">
              <img src={image.dataUrl} alt={image.name} />
              <input
                type="text"
                defaultValue={image.name}
                onBlur={(event) => handleImageNameChange(event, image.id)}
                className="file-name-input"
              />
              <button
                className="delete-button"
                onClick={() => handleImageDelete(image.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button onClick={handleButtonClick} className="upload-button">
          Select Images
        </button>
        <button onClick={handleSubmit} className="submit-button">
          Submit
        </button>
        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
      </div>
    </div>
  );
}

export default UploadPage;
