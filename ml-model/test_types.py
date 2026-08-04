
import os
import pickle
import numpy as np

src_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(src_dir, 'models', 'svm_tomato_model.pkl')

print("Loading model...")
with open(model_path, 'rb') as f:
    data = pickle.load(f)

label_encoder = data['label_encoder']
print("\nTesting inverse_transform...")
pred = 0  # test with first class
inv = label_encoder.inverse_transform([pred])
print(f"inv: type={type(inv)}, value={inv}")
disease = inv[0]
print(f"disease: type={type(disease)}, value={disease}")
print(f"isinstance(disease, np.generic): {isinstance(disease, np.generic)}")
