import joblib
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import os
import urllib.request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'models', 'svm_tomato_model.pkl')
ONNX_PATH = os.path.join(BASE_DIR, '..', 'models', 'vgg16_features.onnx')

# Download ONNX if not exists
VGG16_ONNX_URL = os.environ.get('VGG16_ONNX_URL', '')
if not os.path.exists(ONNX_PATH) and VGG16_ONNX_URL:
    print(f"Downloading ONNX from {VGG16_ONNX_URL}...")
    os.makedirs(os.path.dirname(ONNX_PATH), exist_ok=True)
    urllib.request.urlretrieve(VGG16_ONNX_URL, ONNX_PATH)
    print("✅ ONNX downloaded")

bundle = joblib.load(MODEL_PATH)
svm = bundle['model']
scaler = bundle['scaler']
label_encoder = bundle['label_encoder']
CLASSES = list(label_encoder.classes_)

session = ort.InferenceSession(ONNX_PATH)
INPUT_NAME = session.get_inputs()[0].name

VGG_BGR_MEAN = np.array([103.939, 116.779, 123.68], dtype=np.float32)

def extract_features(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224))
    arr = np.asarray(img, dtype=np.float32)[None, ...]
    arr = arr[..., ::-1] - VGG_BGR_MEAN
    return session.run(None, {INPUT_NAME: arr})[0]

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": True, "classes": CLASSES}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    features = extract_features(contents)
    features = scaler.transform(features)
    pred_idx = int(svm.predict(features)[0])
    proba = svm.predict_proba(features)[0]
    disease = label_encoder.inverse_transform([pred_idx])[0]
    return {
        "disease": disease,
        "confidence": round(float(proba[pred_idx]) * 100, 2),
        "status": "Healthy" if disease == "Healthy" else "Diseased",
        "probabilities": {
            CLASSES[i]: round(float(p) * 100, 4) for i, p in enumerate(proba)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
