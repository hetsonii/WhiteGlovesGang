import os
import math
from sklearn import neighbors
import face_recognition
from face_recognition.face_recognition_cli import image_files_in_folder
import pickle
import numpy as np

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
        if n_neighbors is None:
            n_neighbors = int(round(math.sqrt(len(X))))
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

train("train_img", "classifier/trained_knn_model.clf")  # add path here
