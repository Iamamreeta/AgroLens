import numpy as np
import cv2
import pickle
from tensorflow.keras.applications import VGG16
from tensorflow.keras.applications.vgg16 import preprocess_input
from tensorflow.keras.preprocessing.image import load_img, img_to_array

class TomatoPredictor:
    def __init__(self, model_path='models/svm_tomato_model.pkl'):
        print("📥 Loading models...")
        self.vgg16 = VGG16(weights='imagenet', include_top=False, pooling='avg')
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
        self.svm = data['model']
        self.scaler = data['scaler']
        self.label_encoder = data['label_encoder']
        self.classes = data['classes']
        print(f"✅ Model loaded! Classes: {self.classes}")
    
    def extract_features(self, image_path):
        img = load_img(image_path, target_size=(224, 224))
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        features = self.vgg16.predict(img_array, verbose=0)
        return features.flatten()
    
    def is_leaf(self, image_path):
        """Check if image contains a leaf using color analysis"""
        img = cv2.imread(image_path)
        if img is None:
            return False, 0.0
        
        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Green color range for leaves
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        
        # Create mask for green regions
        mask = cv2.inRange(hsv, lower_green, upper_green)
        green_ratio = np.sum(mask > 0) / (mask.shape[0] * mask.shape[1])
        
        # Check if image has significant green (leaf-like)
        is_leaf = green_ratio > 0.15
        return is_leaf, green_ratio
    
    def predict(self, image_path):
        """Predict disease from image"""
        # Check if it's a leaf
        is_leaf, green_ratio = self.is_leaf(image_path)
        
        # Extract features
        features = self.extract_features(image_path)
        features = features.reshape(1, -1)
        features_scaled = self.scaler.transform(features)
        
        # Predict
        pred = self.svm.predict(features_scaled)[0]
        prob = self.svm.predict_proba(features_scaled)[0]
        
        disease = self.label_encoder.inverse_transform([pred])[0]
        confidence = np.max(prob) * 100
        probabilities = {self.classes[i]: prob[i] * 100 for i in range(len(self.classes))}
        
        return {
            'disease': disease,
            'confidence': round(confidence, 2),
            'status': 'Healthy' if disease == 'Healthy' else 'Diseased',
            'probabilities': probabilities,
            'is_leaf': is_leaf,
            'green_ratio': round(green_ratio * 100, 2)
        }