import os
import numpy as np
import pickle
from tensorflow.keras.applications import VGG16
from tensorflow.keras.applications.vgg16 import preprocess_input
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tqdm import tqdm

print("=" * 50)
print("🔬 FEATURE EXTRACTION")
print("=" * 50)

print("\n📥 Loading VGG16...")
vgg16 = VGG16(weights='imagenet', include_top=False, pooling='avg')
print("✅ VGG16 loaded!")

def extract_features(img_path):
    img = load_img(img_path, target_size=(224, 224))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    features = vgg16.predict(img_array, verbose=0)
    return features.flatten()

print("\n📂 Processing training images...")
train_features = []
train_labels = []

classes = ['Early_blight', 'Late_blight', 'Healthy', 'Leaf_mold']

for class_name in classes:
    class_path = f'dataset/train/{class_name}'
    if os.path.exists(class_path):
        images = [f for f in os.listdir(class_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
        print(f"   {class_name}: {len(images)} images")
        
        for img_file in tqdm(images):
            img_path = os.path.join(class_path, img_file)
            features = extract_features(img_path)
            train_features.append(features)
            train_labels.append(class_name)

os.makedirs('features', exist_ok=True)
with open('features/train_features.pkl', 'wb') as f:
    pickle.dump({'features': np.array(train_features), 'labels': np.array(train_labels)}, f)

print(f"\n✅ Saved {len(train_features)} training features")

print("\n📂 Processing test images...")
test_features = []
test_labels = []

for class_name in classes:
    class_path = f'dataset/test/{class_name}'
    if os.path.exists(class_path):
        images = [f for f in os.listdir(class_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
        print(f"   {class_name}: {len(images)} images")
        
        for img_file in tqdm(images):
            img_path = os.path.join(class_path, img_file)
            features = extract_features(img_path)
            test_features.append(features)
            test_labels.append(class_name)

with open('features/test_features.pkl', 'wb') as f:
    pickle.dump({'features': np.array(test_features), 'labels': np.array(test_labels)}, f)

print(f"\n✅ Saved {len(test_features)} test features")
print("\n🎉 FEATURE EXTRACTION COMPLETE!")
print("=" * 50)