
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import tempfile
import sys
import traceback

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
from predict import TomatoPredictor, convert_numpy

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
            "data": convert_numpy(result)
        }
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        filename = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        return {
            "success": False,
            "stage": "FastAPI Prediction",
            "exception": str(e),
            "traceback": traceback.format_exc(),
            "filename": filename,
            "line": exc_tb.tb_lineno
        }
    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

