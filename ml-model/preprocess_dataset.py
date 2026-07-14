import os
import shutil
from sklearn.model_selection import train_test_split
import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
from tqdm import tqdm

print("=" * 60)
print("🔬 DATASET PREPROCESSING")
print("=" * 60)

# ============================================
# CONFIGURATION
# ============================================

CLASSES = ['Early_blight', 'Healthy', 'Late_blight', 'Leaf_mold']
TRAIN_RATIO = 0.8  # 80% train, 20% test
SOURCE_FOLDER = "dataset/train"
TARGET_FOLDER = "dataset"

# ============================================
# SPLIT DATASET INTO TRAIN/TEST
# ============================================

print("\n📂 Checking dataset...")

# Check if source exists
if not os.path.exists(SOURCE_FOLDER):
    print(f"❌ Source folder '{SOURCE_FOLDER}' not found!")
    print("   Make sure your dataset is in dataset/train/")
    exit(1)

print(f"✅ Source folder found: {SOURCE_FOLDER}")
print(f"   Classes: {os.listdir(SOURCE_FOLDER)}")

# Create test folder if it doesn't exist
os.makedirs(f"{TARGET_FOLDER}/test", exist_ok=True)

print("\n📊 Splitting dataset into train/test (80/20)...")

for class_name in CLASSES:
    source_path = os.path.join(SOURCE_FOLDER, class_name)
    if not os.path.exists(source_path):
        print(f"⚠️ Class '{class_name}' not found in source!")
        continue
    
    # Get all images
    images = [f for f in os.listdir(source_path) 
             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if len(images) == 0:
        print(f"⚠️ No images found for {class_name}")
        continue
    
    # Split into train/test
    train_imgs, test_imgs = train_test_split(images, test_size=0.2, random_state=42)
    
    # Create folders
    os.makedirs(f"{TARGET_FOLDER}/test/{class_name}", exist_ok=True)
    
    # Move test images
    for img in tqdm(test_imgs, desc=f"   Moving {class_name} test"):
        src = os.path.join(source_path, img)
        dst = os.path.join(TARGET_FOLDER, 'test', class_name, img)
        if not os.path.exists(dst):
            shutil.move(src, dst)
    
    print(f"   ✅ {class_name}: {len(train_imgs)} train, {len(test_imgs)} test")

print("\n✅ Dataset split complete!")

# ============================================
# VERIFY DATASET
# ============================================

print("\n📊 Dataset Summary:")
print("=" * 60)

total_train = 0
total_test = 0

for class_name in CLASSES:
    train_path = os.path.join(SOURCE_FOLDER, class_name)
    test_path = os.path.join(TARGET_FOLDER, 'test', class_name)
    
    train_count = len([f for f in os.listdir(train_path) 
                      if f.endswith(('.jpg', '.jpeg', '.png'))]) if os.path.exists(train_path) else 0
    test_count = len([f for f in os.listdir(test_path) 
                     if f.endswith(('.jpg', '.jpeg', '.png'))]) if os.path.exists(test_path) else 0
    
    total_train += train_count
    total_test += test_count
    print(f"   {class_name}: {train_count} train, {test_count} test")

print("=" * 60)
print(f"   Total: {total_train} train, {total_test} test")
print(f"   Total images: {total_train + total_test}")
print("=" * 60)

print("\n🎉 Preprocessing complete!")