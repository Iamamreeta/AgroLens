import joblib
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
from PIL import Image
import io
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load SVM model
model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'svm_tomato_model.pkl')
model = joblib.load(model_path)
CLASSES = ['Early_blight', 'Healthy', 'Late_blight', 'Leaf_mold']

def extract_features(image_bytes):
    """Extract features from image (matching the training)"""
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = img.resize((256, 256))
    img_array = np.array(img)
    
    # Convert to HSV
    hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
    
    # Extract color histograms
    features = []
    for channel in range(3):
        hist = cv2.calcHist([hsv], [channel], None, [256], [0, 256])
        hist = hist.flatten() / np.sum(hist)
        features.extend(hist[:170])  # 170 * 3 = 510 features
    
    # Pad or truncate to 512 features
    if len(features) < 512:
        features = features + [0] * (512 - len(features))
    elif len(features) > 512:
        features = features[:512]
    
    return np.array(features).reshape(1, -1)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "classes": CLASSES
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read image
        contents = await file.read()
        
        # Extract features
        features = extract_features(contents)
        
        # Predict
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        confidence = max(probabilities) * 100
        
        return {
            "disease": prediction,
            "confidence": round(confidence, 2),
            "status": "Healthy" if prediction == "Healthy" else "Diseased",
            "probabilities": {
                CLASSES[i]: round(probabilities[i] * 100, 4)
                for i in range(len(CLASSES))
            }
        }
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)