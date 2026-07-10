import os
import cv2
import numpy as np

print("=" * 50)
print("🌱 CREATING TEST DATASET")
print("=" * 50)

classes = ['Early_blight', 'Late_blight', 'Healthy', 'Leaf_mold']

for class_name in classes:
    # Create train folder
    train_path = f'dataset/train/{class_name}'
    os.makedirs(train_path, exist_ok=True)
    
    # Create test folder
    test_path = f'dataset/test/{class_name}'
    os.makedirs(test_path, exist_ok=True)
    
    # Create 5 dummy images for training
    for i in range(5):
        img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        cv2.imwrite(f'{train_path}/train_{i}.jpg', img)
    
    # Create 2 dummy images for testing
    for i in range(2):
        img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        cv2.imwrite(f'{test_path}/test_{i}.jpg', img)
    
    print(f'✅ Created {class_name}')

print("\n✅ Dataset ready!")
print("=" * 50)