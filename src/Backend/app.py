import cv2
import os
import csv
import json
import pickle
import math
import shutil
import face_recognition
from flask import Flask, render_template, request, Response
from flask import redirect, url_for, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from sklearn import neighbors
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

UPLOAD_FOLDER = r'public/images'  # Change this to the desired upload folder
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
webcam = None

def train_from_uploaded_images(upload_folder, model_save_path):
    X = []
    y = []

    for class_dir in os.listdir(upload_folder):
        if not os.path.isdir(os.path.join(upload_folder, class_dir)):
            continue

        for img_path in image_files_in_folder(os.path.join(upload_folder, class_dir)):
            image = face_recognition.load_image_file(img_path)
            face_bounding_boxes = face_recognition.face_locations(image)

            if len(face_bounding_boxes) != 1:
                continue

            face_encoding = face_recognition.face_encodings(image, known_face_locations=face_bounding_boxes)[0]

            if len(face_encoding) > 0:
                flattened_face_encoding = np.array(face_encoding).flatten()
                X.append(flattened_face_encoding)
                y.append(class_dir)

    if len(X) > 0:
        # Choose a value of n_neighbors that is less than or equal to the number of samples
        n_neighbors = min(int(round(math.sqrt(len(X)))), len(X))
        knn_clf = neighbors.KNeighborsClassifier(n_neighbors=n_neighbors, algorithm='ball_tree', weights='distance')
        knn_clf.fit(X, y)

        if model_save_path is not None:
            with open(model_save_path, 'wb') as f:
                pickle.dump(knn_clf, f)
            print("Training complete")
        return knn_clf
    else:
        print("No valid face encodings found for training.")
        return None

def train(train_dir, model_save_path, n_neighbors=2, knn_algo='ball_tree', verbose=False):
    X = []
    y = []
    # Loop through each person in the training set
    for class_dir in os.listdir(train_dir):
        if not os.path.isdir(os.path.join(train_dir, class_dir)):
            continue
        # Loop through each training image for the current person
        for img_path in image_files_in_folder(os.path.join(train_dir, class_dir)):
            image = face_recognition.load_image_file(img_path)
            face_bounding_boxes = face_recognition.face_locations(image)
            print("processing:", img_path)
            if len(face_bounding_boxes) != 1:
                # If there are no people (or too many people) in a training image, skip the image.
                if verbose:
                    print("Image {} not suitable for training: {}".format(img_path, "Didn't find a face" if len(face_bounding_boxes) < 1 else "Found more than one face"))
            else:
                # Add face encoding for the current image to the training set
                face_encoding = face_recognition.face_encodings(image, known_face_locations=face_bounding_boxes)[0]
                # Check if the face encoding is valid
                if len(face_encoding) > 0:
                    # Reshape to 1D array
                    flattened_face_encoding = np.array(face_encoding).flatten()
                    X.append(flattened_face_encoding)
                    y.append(class_dir)

    # Check if there are valid samples in X before fitting the classifier
    if len(X) > 0:
        # Determine how many neighbors to use for weighting in the KNN classifier
        if n_neighbors is None or n_neighbors > len(X):
            # n_neighbors = int(round(math.sqrt(len(X))))
            n_neighbors = min(10, len(X))
            if verbose:
                print("Chose n_neighbors automatically:", n_neighbors)
        # Create and train the KNN classifier
        knn_clf = neighbors.KNeighborsClassifier(n_neighbors=n_neighbors, algorithm=knn_algo, weights='distance')
        knn_clf.fit(X, y)
        # Save the trained KNN classifier
        if model_save_path is not None:
            with open(model_save_path, 'wb') as f:
                pickle.dump(knn_clf, f)
            print("Training complete")
        return knn_clf
    else:
        print("No valid face encodings found for training.")
        return None


def image_files_in_folder(folder):
    return [os.path.join(folder, f) for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    

# Function to save an uploaded file with a unique name in its subfolder
def save_uploaded_file(file, upload_folder, filename):
    # Generate a unique subfolder name based on the filename without extension
    folder_name = os.path.splitext(filename)[0]
    subfolder_path = os.path.join(upload_folder, folder_name)

    # Generate a unique filename if a file with the same name exists
    count = 1
    while os.path.exists(os.path.join(subfolder_path, filename)):
        count += 1
        filename_without_ext, file_extension = os.path.splitext(filename)
        filename = f"{filename_without_ext}{count}{file_extension}"

    # Create the subfolder if it doesn't exist
    os.makedirs(subfolder_path, exist_ok=True)

    # Save the file with the unique name inside the subfolder
    file.save(os.path.join(subfolder_path, filename))

def find_camera_index():
    # Try opening cameras from index 0 onwards
    index = 0
    while True:
        cap = cv2.VideoCapture(index)
        if not cap.isOpened():
            cap.release()
            index += 1
            if index >= 10:  
                return None  # No camera found within the specified range
        else:
            cap.release()
            return index


def takeAttendance(name):
    csv_path = '../data/attendance.csv'
    
    with open(csv_path, 'a+') as f:
        f.seek(0)
        lines = f.readlines()
        nameList = [line.split(',')[0] for line in lines]
        
        now = datetime.now()
        datestring = now.strftime('%H:%M:%S')
        
        if name not in nameList:
            f.write(f'{name},{datestring},,\n')
        else:
            # Update the existing entry with outtime and duration
            for line in lines:
                if line.startswith(name):
                    # Extract intime
                    intime = line.split(',')[1]
                    # Calculate duration
                    intime_dt = datetime.strptime(intime, '%H:%M:%S')
                    outtime_dt = now
                    duration = outtime_dt - intime_dt
                    # print(str(duration).split(',')[1])

                    duration_str = str(duration).split(',')[1].split('.')[0].strip()  # Convert to string in right format

                    updated_line = f'{name},{intime},{now.strftime("%H:%M:%S")},{duration_str}\n'
                    lines[lines.index(line)] = updated_line
                    break
            
            # Write the updated content back to the file
            f.seek(0)
            f.truncate()
            f.writelines(lines)
            
    # Create JSON file with the updated data
    jsonAttendanceData = []
    with open(csv_path) as csvFile:
        csvReader = csv.reader(csvFile)
        for row in csvReader:
            jsonAttendanceData.append({
                'name': row[0],
                'intime': row[1],
                'outtime': row[2],
                'duration': row[3]
            })

    with open('../data/attendance.json', 'w') as jsonFile:
        jsonFile.write(json.dumps(jsonAttendanceData, indent=4))


def predict(img, knn_clf=None, model_path=None, threshold=0.5):
    if knn_clf is None and model_path is None:
        raise Exception("Must supply knn classifier either through knn_clf or model_path")
    # Load a trained KNN model (if one was passed in)
    if knn_clf is None:
        with open(model_path, 'rb') as f:
            knn_clf = pickle.load(f)
    # Load image file and find face locations
    img = img
    face_boxes = face_recognition.face_locations(img)
    # If no faces are found in the image, return an empty result.
    if len(face_boxes) == 0:
        return []
    # Find encodings for faces in the test image
    faces_encodings = face_recognition.face_encodings(img, known_face_locations=face_boxes)
    
    predictions = []
    
    for face_encoding, face_box in zip(faces_encodings, face_boxes):
        # Use the KNN model to find the best match for each face
        closest_distances = knn_clf.kneighbors([face_encoding], n_neighbors=1)
        is_match = closest_distances[0][0][0] <= threshold
        
        if is_match:
            name = knn_clf.predict([face_encoding])[0]
        else:
            name = "unknown"
        
        predictions.append((name, face_box))
    
    return predictions


def gen():
    global webcam

    if webcam is None:
        webcam = cv2.VideoCapture(find_camera_index())

    rval, frame = webcam.read()

    while rval:
        frame = cv2.flip(frame, 1)
        frame_copy = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        frame_copy = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
        predictions = predict(frame_copy, model_path="../../public/classifier/trained_knn_model.clf")  # Update path
        font = cv2.FONT_HERSHEY_DUPLEX

        for name, (top, right, bottom, left) in predictions:
            top *= 4  # scale back the frame since it was scaled to 1/4 in size
            right *= 4
            bottom *= 4
            left *= 4
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 255), 2)
            cv2.putText(frame, name, (left - 10, top - 6), font, 0.8, (255, 255, 255), 1)

            if name != 'unknown':
                takeAttendance(name)

        ret, jpeg = cv2.imencode('.jpg', frame)
        frame_encoded = jpeg.tobytes()
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_encoded + b'\r\n')

        rval, frame = webcam.read()

    webcam.release()
    cv2.destroyAllWindows()


@app.route('/upload', methods=['POST'])
def upload_files():
    uploaded_files = request.files.getlist('file')  # Get a list of uploaded files

    if len(uploaded_files) == 0:
        return jsonify({'error': 'No files provided'})

    uploaded_filenames = []

    for file in uploaded_files:
        if file.filename == '':
            continue  

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            save_uploaded_file(file, app.config['UPLOAD_FOLDER'], filename)
            uploaded_filenames.append(filename)

    if uploaded_filenames:
        train("public/images/", "public/classifier/trained_knn_model.clf")

        # Optionally, you can return a response with the list of successfully uploaded filenames
        return jsonify({'success': 'Files uploaded and trained successfully', 'uploaded_files': uploaded_filenames})
    else:
        return jsonify({'error': 'No valid files uploaded'})


@app.route('/predict', methods=['POST'])
def predict_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'})

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Empty filename'})

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        img = cv2.imread(img_path)
        predictions = predict(img, model_path="classifier/trained_knn_model.clf")  
        # Process predictions as needed
        for name, (top, right, bottom, left) in predictions:
            takeAttendance(name)  # Call the takeAttendance function here
        return jsonify({'predictions': result})
    else:
        return jsonify({'error': 'Invalid file format'})


@app.route('/submit-attendance', methods=['POST'])
def submit_attendance():
    try:
        archive_folder = '../data/archive/'
        current_date = datetime.now().strftime('%Y-%m-%d')
        save_time = datetime.now().strftime('%H-%M-%S')

        shutil.move('../data/attendance.csv', f'{archive_folder}attendance_{current_date}_{save_time}.csv')
        shutil.move('../data/attendance.json', f'{archive_folder}attendance_{current_date}_{save_time}.json')

        # Clear current csv file
        open('../data/attendance.csv', 'w').close()

        # Overwrite the JSON file with an empty array
        with open('../data/attendance.json', 'w') as jsonFile:
            jsonFile.write("[]")

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# @app.route('/success', methods=['GET', 'POST'])
# def success():
#     if 'file' not in request.files:
#         return render_template('upload.html')
#     file = request.files['file']
#     if file.filename == '':
#         return render_template('upload.html')
#     if file and allowed_file(file.filename):
#         filename = secure_filename(file.filename)
#         save_uploaded_file(file, app.config['UPLOAD_FOLDER'], filename)
#         train("public/images/", "public/classifier/trained_knn_model.clf")
#         return render_template('upload.html')
#     else:
#         return render_template('upload.html')


@app.route('/release_webcam')
def release_webcam():
    global webcam
    if webcam is not None:
        webcam.release()
        cv2.destroyAllWindows()
        webcam = None  # Reset the webcam variable
        return jsonify({'success': True})
    else:
        return 'Webcam is not currently active'


@app.route('/video_feed')
def video_feed():
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

# @app.route('/train_classifier', methods=['GET', 'POST'])
# def train_classifier():
#     train_from_uploaded_images(app.config['UPLOAD_FOLDER'], 'public/classifier/trained_knn_model.clf')
#     return redirect(url_for('upload_file'))

if __name__ == "__main__":
    app.run(debug=True)
