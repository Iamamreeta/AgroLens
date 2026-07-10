"""
STEP 2: Train SVM Classifier for Tomato Disease Detection
As per proposal: SVM with VGG16 features
"""

import os
import numpy as np
import pickle
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import time

print("=" * 60)
print("🤖 SVM TRAINING FOR TOMATO DISEASE DETECTION")
print("=" * 60)
start_time = time.time()

# ============================================
# 1. LOAD FEATURES
# ============================================
print("\n📂 Loading extracted features...")

try:
    with open('features/train_features.pkl', 'rb') as f:
        train_data = pickle.load(f)
    
    with open('features/test_features.pkl', 'rb') as f:
        test_data = pickle.load(f)
    
    X_train = train_data['features']
    y_train = train_data['labels']
    X_test = test_data['features']
    y_test = test_data['labels']
    
    print(f"   ✅ Training data: {X_train.shape[0]} samples, {X_train.shape[1]} features")
    print(f"   ✅ Test data: {X_test.shape[0]} samples, {X_test.shape[1]} features")
    
except FileNotFoundError as e:
    print(f"❌ Error: {e}")
    print("   Please run feature_extraction.py first!")
    exit(1)

# ============================================
# 2. ENCODE LABELS
# ============================================
print("\n🔄 Encoding labels...")
label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)
y_test_encoded = label_encoder.transform(y_test)

classes = label_encoder.classes_
print(f"   ✅ Classes: {classes}")

# ============================================
# 3. SCALE FEATURES
# ============================================
print("\n📊 Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print(f"   ✅ Features scaled successfully!")

# ============================================
# 4. TRAIN SVM
# ============================================
print("\n🤖 Training SVM Classifier...")
print("   Kernel: RBF")
print("   C: 1.0")
print("   Gamma: scale")

svm = SVC(
    kernel='rbf',        # RBF kernel works well for image features
    C=1.0,               # Regularization parameter
    gamma='scale',       # Kernel coefficient
    probability=True,    # Enable confidence scores
    random_state=42,     # For reproducibility
    verbose=False
)

svm.fit(X_train_scaled, y_train_encoded)
print("   ✅ Training complete!")

# ============================================
# 5. EVALUATE
# ============================================
print("\n📊 Evaluating model...")

# Predict on test set
y_pred_encoded = svm.predict(X_test_scaled)
y_pred_proba = svm.predict_proba(X_test_scaled)

# Convert predictions back to class names for display
y_pred = label_encoder.inverse_transform(y_pred_encoded)

# Calculate accuracy
accuracy = accuracy_score(y_test_encoded, y_pred_encoded)
print(f"\n   🎯 Accuracy: {accuracy * 100:.2f}%")

# Classification Report (using encoded labels)
print("\n📋 Classification Report:")
print("=" * 50)
print(classification_report(y_test_encoded, y_pred_encoded, target_names=classes))
print("=" * 50)

# ============================================
# 6. CONFUSION MATRIX
# ============================================
print("\n📊 Confusion Matrix:")
cm = confusion_matrix(y_test_encoded, y_pred_encoded)
print(cm)

# ============================================
# 7. PLOT CONFUSION MATRIX
# ============================================
print("\n📊 Generating confusion matrix plot...")

plt.figure(figsize=(10, 8))
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    xticklabels=classes,
    yticklabels=classes,
    cbar=True,
    square=True
)
plt.title('Confusion Matrix - Tomato Disease Classification', fontsize=16)
plt.xlabel('Predicted', fontsize=14)
plt.ylabel('Actual', fontsize=14)
plt.tight_layout()

# Save the plot
os.makedirs('results', exist_ok=True)
plt.savefig('results/confusion_matrix.png', dpi=300, bbox_inches='tight')
print("   ✅ Confusion matrix saved to 'results/confusion_matrix.png'")
# plt.show()  # Uncomment to display

# ============================================
# 8. SAVE MODEL
# ============================================
print("\n💾 Saving model...")
os.makedirs('models', exist_ok=True)

model_data = {
    'model': svm,
    'scaler': scaler,
    'label_encoder': label_encoder,
    'classes': classes,
    'accuracy': accuracy,
    'kernel': 'rbf',
    'C': 1.0,
    'gamma': 'scale'
}

model_path = 'models/svm_tomato_model.pkl'
with open(model_path, 'wb') as f:
    pickle.dump(model_data, f)

print(f"   ✅ Model saved to '{model_path}'")

# ============================================
# 9. SUMMARY
# ============================================
end_time = time.time()
elapsed_time = end_time - start_time

print("\n" + "=" * 60)
print("🎉 TRAINING COMPLETE!")
print("=" * 60)
print(f"   📊 Accuracy: {accuracy * 100:.2f}%")
print(f"   📂 Model saved: models/svm_tomato_model.pkl")
print(f"   📊 Confusion matrix: results/confusion_matrix.png")
print(f"   ⏱️  Time taken: {elapsed_time:.2f} seconds")
print("=" * 60)

# Save training results
with open('results/training_results.txt', 'w') as f:
    f.write("=" * 60 + "\n")
    f.write("TRAINING RESULTS - SVM TOMATO DISEASE CLASSIFICATION\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Accuracy: {accuracy * 100:.2f}%\n\n")
    f.write("Classification Report:\n")
    f.write(classification_report(y_test_encoded, y_pred_encoded, target_names=classes) + "\n\n")
    f.write("Confusion Matrix:\n")
    f.write(str(cm) + "\n\n")
    f.write(f"Classes: {classes}\n")
    f.write(f"Training samples: {X_train.shape[0]}\n")
    f.write(f"Test samples: {X_test.shape[0]}\n")
    f.write(f"Features: {X_train.shape[1]}\n")
    f.write(f"Kernel: rbf\n")
    f.write(f"C: 1.0\n")
    f.write(f"Gamma: scale\n")
    f.write(f"Time taken: {elapsed_time:.2f} seconds\n")
print("   ✅ Results saved to 'results/training_results.txt'")

print("\n🚀 Next Steps:")
print("   1. Start FastAPI: cd api && python app.py")
print("   2. Start Backend: node src/app.js")
print("   3. Run Mobile App: npx react-native run-android")