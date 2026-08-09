import os
import warnings
import joblib
import numpy as np
import sklearn
from sklearn.exceptions import InconsistentVersionWarning
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

MODEL_PATH = os.path.join("models", "svm_tomato_model.pkl")
TEST_PATH = os.path.join("features", "test_features.pkl")

print("=" * 60)
print("🔍 AGROLENS MODEL EVALUATION")
print("=" * 60)

# 1. Load test data
print("\n📂 Loading test data...")
test = joblib.load(TEST_PATH)
X_test = np.asarray(test["features"])
y_labels = np.asarray(test["labels"])
print(f"✅ Test data: {X_test.shape[0]} samples x {X_test.shape[1]} features")

# 2. Load model
print("\n📂 Loading model...")
bundle = joblib.load(MODEL_PATH)
svm = bundle["model"]
scaler = bundle["scaler"]
le = bundle["label_encoder"]
classes = list(le.classes_)
print(f"✅ Model loaded. Classes: {classes}")

# 3. Clean labels - convert np.str_ to regular strings
if y_labels.dtype.kind in ("U", "S", "O"):
    y_labels_clean = [str(label) for label in y_labels]
    # Re-encode with a fresh LabelEncoder to avoid np.str_ issues
    fresh_le = LabelEncoder()
    y_true = fresh_le.fit_transform(y_labels_clean)
else:
    y_true = y_labels.astype(int)

# 4. Scale features
print("\n🔮 Scaling features...")
Xs = scaler.transform(X_test)
print("✅ Features scaled")

# 5. Predict
print("\n🔮 Making predictions...")
y_pred = svm.predict(Xs)

# 6. Calculate metrics
acc = accuracy_score(y_true, y_pred)
print(f"\n📈 ACCURACY: {acc * 100:.2f}% ({int(round(acc * len(y_true)))}/{len(y_true)} correct)")

# 7. Classification Report
print("\n📋 CLASSIFICATION REPORT:")
print(classification_report(y_true, y_pred, target_names=classes))

# 8. Confusion Matrix
print("\n📊 CONFUSION MATRIX:")
print(confusion_matrix(y_true, y_pred))

print("\n✅ Done!")