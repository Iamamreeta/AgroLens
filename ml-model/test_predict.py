
import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from predict import TomatoPredictor, convert_numpy

print("🚀 Testing TomatoPredictor...")
predictor = TomatoPredictor()

# Create a test image (let's create a simple dummy image)
import numpy as np
import cv2
test_image_path = os.path.join(os.path.dirname(__file__), 'test_image.jpg')
dummy_img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
cv2.imwrite(test_image_path, dummy_img)
print(f"✅ Created test image at {test_image_path}")

# Predict
print("🤖 Running predict...")
result = predictor.predict(test_image_path)
print("\n📊 Result:")
print(type(result))
print(result)
print("\n🔍 Checking types:")
for k, v in result.items():
    print(f"{k}: type={type(v)}, value={v}")

# Test json.dumps
print("\n🧪 Testing json.dumps...")
try:
    json_str = json.dumps(result)
    print("✅ json.dumps SUCCESS!")
    print(f"JSON: {json_str}")
except Exception as e:
    print(f"❌ json.dumps FAILED: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

# Cleanup test image
os.unlink(test_image_path)
print("\n🧹 Cleaned up test image")
