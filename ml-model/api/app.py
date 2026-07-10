from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
from predict import TomatoPredictor

app = FastAPI(title="AgroLens ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = TomatoPredictor()

@app.get("/")
def root():
    return {"message": "AgroLens ML API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy", "classes": predictor.classes, "model_loaded": True}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        result = predictor.predict(tmp_path)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)