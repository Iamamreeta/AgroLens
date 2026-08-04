
import numpy as np
import cv2
import pickle
import os
from tensorflow.keras.applications import VGG16
from tensorflow.keras.applications.vgg16 import preprocess_input
from tensorflow.keras.preprocessing.image import load_img, img_to_array

def convert_numpy(obj):
    """Recursively convert numpy types to native Python types (NumPy 2.x compatible)."""
    if obj is None:
        return None
    if isinstance(obj, np.ndarray):
        return [convert_numpy(v) for v in obj.tolist()]
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, (np.int8, np.int16, np.int32, np.int64,
                        np.uint8, np.uint16, np.uint32, np.uint64,
                        np.intc, np.intp)):
        return int(obj)
    if isinstance(obj, (np.float16, np.float32, np.float64,
                        np.half, np.single, np.double)):
        return float(obj)
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [convert_numpy(item) for item in obj]
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if hasattr(obj, 'dtype') and hasattr(obj, 'item') and callable(obj.item):
        try:
            native = obj.item()
            if isinstance(native, (np.bool_,)):
                return bool(native)
            if isinstance(native, (np.floating,)):
                return float(native)
            if isinstance(native, (np.integer,)):
                return int(native)
            return native
        except Exception:
            pass
    try:
        return obj.item() if hasattr(obj, 'item') and callable(obj.item) else obj
    except Exception:
        return obj

class TomatoPredictor:
    def __init__(self, model_path=None):
        print("[AgroLens ML] Loading models...")
        if model_path is None:
            src_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(src_dir, '..', 'models', 'svm_tomato_model.pkl')
        self.vgg16 = VGG16(weights='imagenet', include_top=False, pooling='avg')
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
        if not isinstance(data, dict):
            raise ValueError(
                f"Expected pickled dictionary with keys "
                f"[model,scaler,label_encoder,classes], got {type(data)}"
            )
        required = ['model', 'scaler', 'label_encoder', 'classes']
        missing = [k for k in required if k not in data]
        if missing:
            raise ValueError(f".pkl missing keys: {missing}. Got keys: {list(data.keys())}")
        self.svm = data['model']
        self.scaler = data['scaler']
        self.label_encoder = data['label_encoder']
        self.classes = [str(c) for c in list(data['classes'])]
        print(f"[AgroLens ML] Model ready. Classes: {self.classes}")

    def extract_features(self, image_path):
        img = load_img(image_path, target_size=(224, 224))
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)
        features = self.vgg16.predict(img_array, verbose=0)
        return features.flatten()

    def is_leaf(self, image_path):
        """Check if image contains a leaf using HSV green-ratio analysis."""
        img = cv2.imread(image_path)
        if img is None:
            return False, 0.0
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        mask = cv2.inRange(hsv, lower_green, upper_green)
        green_ratio = float(np.sum(mask > 0)) / float(mask.shape[0] * mask.shape[1])
        is_leaf = green_ratio > 0.15
        return bool(is_leaf), float(green_ratio)

    def predict(self, image_path):
        is_leaf, green_ratio = self.is_leaf(image_path)

        features = self.extract_features(image_path)
        features = features.reshape(1, -1)
        features_scaled = self.scaler.transform(features)

        pred_idx = int(self.svm.predict(features_scaled)[0])
        prob = self.svm.predict_proba(features_scaled)[0]

        raw_disease = self.label_encoder.inverse_transform([pred_idx])[0]
        disease = str(raw_disease)
        confidence = float(np.max(prob)) * 100.0
        probabilities = {
            str(self.classes[i]): float(prob[i]) * 100.0
            for i in range(len(self.classes))
        }

        result = {
            'disease': disease,
            'confidence': round(confidence, 2),
            'status': 'Healthy' if disease.lower() == 'healthy' else 'Diseased',
            'probabilities': probabilities,
            'is_leaf': bool(is_leaf),
            'green_ratio': round(float(green_ratio) * 100.0, 2),
        }
        return convert_numpy(result)
