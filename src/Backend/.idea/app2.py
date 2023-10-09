import cv2
import os
import pickle
import face_recognition
from flask import Flask, render_template, request, Response
from werkzeug.utils import secure_filename
from sklearn import neighbors
import numpy as np
from datetime import datetime

UPLOAD_FOLDER = r'/Users/joyshah/Desktop/Images'  # Change this to the desired upload folder
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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
        knn_clf = neighbors.KNeighborsClassifier(n_neighbors=2, algorithm='ball_tree', weights='distance')
        knn_clf.fit(X, y)

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

def takeAttendance(name):
    with open('attendance.csv', 'a+') as f:
        f.seek(0)
        lines = f.readlines()
        nameList = [line.split(',')[0] for line in lines]
        if name not in nameList:
            now = datetime.now()
            datestring = now.strftime('%H:%M:%S')
            f.write(f'{name},{datestring}\n')

def predict(img_path, knn_clf=None, model_path=None, threshold=0.5):
    if knn_clf is None and model_path is None:
        raise Exception("Must supply knn classifier either through knn_clf or model_path")
    # Load a trained KNN model (if one was passed in)
    if knn_clf is None:
        with open(model_path, 'rb') as f:
            knn_clf = pickle.load(f)
    # Load image file and find face locations
    img = img_path
    face_box = face_recognition.face_locations(img)
    # If no faces are found in the image, return an empty result.
    if len(face_box) == 0:
        return []
    # Find encodings for faces in the test image
    faces_encodings = face_recognition.face_encodings(img, known_face_locations=face_box)
    # Use the KNN model to find the best matches for the test face
    closest_distances = knn_clf.kneighbors(faces_encodings, n_neighbors=2)
    matches = [closest_distances[0][i][0] <= threshold for i in range(len(face_box))]
    # Predict classes and remove classifications that aren't within the threshold
    return [(pred, loc) if rec else ("unknown", loc) for pred, loc, rec in zip(knn_clf.predict(faces_encodings), face_box, matches)]

@app.route('/index')
def index():
    """Video streaming home page."""
    return render_template('index.html')

@app.route('/')
def upload_file():
    return render_template('upload.html')

@app.route('/predict', methods=['POST'])
def predict_image():
    if 'file' not in request.files:
        return render_template('upload.html')
    file = request.files['file']
    if file.filename == '':
        return render_template('upload.html')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        img = cv2.imread(img_path)
        predictions = predict(img, model_path="classifier/trained_knn_model.clf")  # Update path
        # Process predictions as needed
        for name, (top, right, bottom, left) in predictions:
            takeAttendance(name)  # Call the takeAttendance function here
        return render_template('prediction.html', predictions=predictions)
    else:
        return render_template('upload.html')

def gen():
    webcam = cv2.VideoCapture(0)
    rval, frame = webcam.read()

    while rval:
        frame = cv2.flip(frame, 1)
        frame_copy = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        frame_copy = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
        predictions = predict(frame_copy, model_path="/Users/joyshah/Desktop/H4I/DlibFaceRecognition/classifier/trained_knn_model.clf")  # Update path
        font = cv2.FONT_HERSHEY_DUPLEX

        for name, (top, right, bottom, left) in predictions:
            top *= 4  # scale back the frame since it was scaled to 1/4 in size
            right *= 4
            bottom *= 4
            left *= 4
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 255), 2)
            cv2.putText(frame, name, (left - 10, top - 6), font, 0.8, (255, 255, 255), 1)

        ret, jpeg = cv2.imencode('.jpg', frame)
        frame_encoded = jpeg.tobytes()
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_encoded + b'\r\n')

        rval, frame = webcam.read()

    webcam.release()
    cv2.destroyAllWindows()

@app.route('/success', methods=['GET', 'POST'])
def success():
    if 'file' not in request.files:
        # flash('No file part')
        return render_template('upload.html')
    file = request.files['file']
    if file.filename == '':
        # flash('No image selected for uploading')
        return render_template('upload.html')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        # print('upload_image filename: ' + filename)
        # flash('Image successfully uploaded and displayed below')
        return render_template('upload.html')
    else:
        # flash('Allowed image types are -> png, jpg, jpeg, gif')
        return render_template('upload.html')

@app.route('/video_feed')
def video_feed():
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(debug=True)
