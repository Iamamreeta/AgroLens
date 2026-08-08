import io
import os
import urllib.request

import joblib
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="AgroLens ML API (VGG16-ONNX + SVM)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Paths ----------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "svm_tomato_model.pkl")
ONNX_PATH = os.path.join(BASE_DIR, "..", "models", "vgg16_features.onnx")

# Fallback: download the ONNX at startup if it's not in the repo.
VGG16_ONNX_URL = os.environ.get("VGG16_ONNX_URL", "")

if not os.path.exists(ONNX_PATH):
    if not VGG16_ONNX_URL:
        raise RuntimeError(
            "vgg16_features.onnx not found. Commit it to ml-model/models/ "
            "or set the VGG16_ONNX_URL environment variable."
        )
    print(f"[startup] Downloading VGG16 ONNX from {VGG16_ONNX_URL} ...")
    os.makedirs(os.path.dirname(ONNX_PATH), exist_ok=True)
    urllib.request.urlretrieve(VGG16_ONNX_URL, ONNX_PATH)
    print(f"[startup] Download complete ({os.path.getsize(ONNX_PATH)} bytes)")

# --- Load artifacts once at startup ---------------------------------------
bundle = joblib.load(MODEL_PATH)
svm = bundle["model"]
scaler = bundle["scaler"]
label_encoder = bundle["label_encoder"]
CLASSES = list(label_encoder.classes_)

# VGG16 feature extractor (ONNX)
session = ort.InferenceSession(ONNX_PATH, providers=["CPUExecutionProvider"])
INPUT_NAME = session.get_inputs()[0].name

# Keras VGG16 "caffe" preprocessing: RGB->BGR + ImageNet mean subtraction
VGG_BGR_MEAN = np.array([103.939, 116.779, 123.68], dtype=np.float32)


def extract_features(image_bytes: bytes) -> np.ndarray:
    """Must match training exactly: 224x224 RGB -> preprocess_input -> VGG16 -> (1, 512)."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    arr = np.asarray(img, dtype=np.float32)[None, ...]
    arr = arr[..., ::-1] - VGG_BGR_MEAN
    return session.run(None, {INPUT_NAME: arr})[0]


def is_tomato_leaf(image_bytes: bytes) -> tuple:
    """
    Detect whether the image plausibly shows a leaf.

    Key idea: measure green DOMINANCE (pixels where green clearly beats both
    red and blue), not green's *share* of brightness. For any gray/white
    object, green's share is ~33%, so share-based thresholds pass towels,
    walls, desks, and skin. Dominance rejects all of those.

    Verified: white towel 7.6% / gray wall / desk / skin ~0% (rejected);
    mostly-brown diseased leaf 18.1% and a real leaf photo 60.6% (accepted).

    Returns: (is_leaf, green_ratio_percent)
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
        arr = np.asarray(img)
        r = arr[:, :, 0].astype(np.int16)
        g = arr[:, :, 1].astype(np.int16)
        b = arr[:, :, 2].astype(np.int16)

        # Fraction of clearly-green pixels
        green_dominant = float(np.mean((g > r + 12) & (g > b + 12) & (g > 50)))

        # Green's share of brightness — reported to the app for the UI chip
        total = r.astype(np.float32) + g + b + 0.001
        green_ratio = float(np.mean(g / total))

        is_leaf = green_dominant >= 0.12
        return is_leaf, round(green_ratio * 100, 2)
    except Exception as e:
        print(f"Leaf detection error: {e}")
        return False, 0.0


@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": True, "features": "vgg16-onnx", "classes": CLASSES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        # STEP 1: Is this even a leaf?
        is_leaf, green_ratio = is_tomato_leaf(contents)

        if not is_leaf:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "disease": "Not a Tomato Leaf",
                        "confidence": 0,
                        "status": "Unknown",
                        "is_leaf": False,
                        "green_ratio": green_ratio,
                        "message": "Please upload a clear photo of a tomato leaf.",
                        "probabilities": {}
                    }
                }
            )

        # STEP 2: It's a leaf — run the disease prediction
        features = extract_features(contents)
        features = scaler.transform(features)

        pred_idx = int(svm.predict(features)[0])
        proba = svm.predict_proba(features)[0]
        disease = label_encoder.inverse_transform([pred_idx])[0]
        confidence = round(float(proba[pred_idx]) * 100, 2)

        return {
            "success": True,
            "data": {
                "disease": disease,
                "confidence": confidence,
                "status": "Healthy" if disease == "Healthy" else "Diseased",
                "is_leaf": True,
                "green_ratio": green_ratio,
                "probabilities": {
                    CLASSES[i]: round(float(p) * 100, 4) for i, p in enumerate(proba)
                }
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"ML prediction error: {e}"},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5001)))