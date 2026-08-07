import tensorflow as tf
from tensorflow.keras.applications import VGG16
import tf2onnx
import onnx

# Load VGG16
model = VGG16(weights='imagenet', include_top=False, pooling='avg')

# Export to ONNX
onnx_model, _ = tf2onnx.convert.from_keras(model, opset=13)

# Save
onnx.save(onnx_model, 'models/vgg16_features.onnx')
print("✅ ONNX model saved to models/vgg16_features.onnx")