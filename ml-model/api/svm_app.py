import joblib
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'svm_tomato_model.pkl')
model = joblib.load(model_path)
CLASSES = ['Early_Blight', 'Healthy', 'Late_Blight', 'Leaf_Mold']

def extract_features(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = img.resize((256, 256))
    img_array = np.array(img)
    
    features = []
    for channel in range(3):
        hist = np.histogram(img_array[:, :, channel], bins=256, range=(0, 256))[0]
        hist = hist / np.sum(hist)
        features.extend(hist[:170])
    
    if len(features) < 512:
        features = features + [0] * (512 - len(features))
    
    return np.array(features).reshape(1, -1)

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": True, "classes": CLASSES}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    features = extract_features(contents)
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)