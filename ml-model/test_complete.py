
import sys
import os
import json
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from predict import TomatoPredictor, convert_numpy

print("Loading TomatoPredictor...")
predictor = TomatoPredictor()

print("Creating dummy image...")
import cv2
import tempfile

with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
    dummy_img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    cv2.imwrite(tmp.name, dummy_img)
    tmp_path = tmp.name

print(f"Running predict on {tmp_path}...")
result = predictor.predict(tmp_path)

print("Predictor returned:")
print(type(result))
print(result)

print("\nChecking types of each field:")
for key, val in result.items():
    print(f"  {key}: {type(val)}")

print("\nTesting convert_numpy...")
converted = convert_numpy(result)
print("Converted result:")
print(converted)
for key, val in converted.items():
    print(f"  {key}: {type(val)}")

print("\nTesting JSON serialization...")
try:
    json_str = json.dumps({"success": True, "data": converted})
    print("SUCCESS: JSON serialization passed!")
    print("Output JSON:", json_str)
except Exception as e:
    print(f"FAILED: JSON serialization error! Type: {type(e).__name__}, Message: {str(e)}")
    import traceback
    traceback.print_exc()

os.unlink(tmp_path)
print("\nCleaned up.")
