
import os
import pickle

src_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(src_dir, 'models', 'svm_tomato_model.pkl')

print("Loading model from:", model_path)
with open(model_path, 'rb') as f:
    data = pickle.load(f)

print("\nModel data keys:", list(data.keys()))
for k, v in data.items():
    print(f"\n{k}: type={type(v)}, value={v}")
