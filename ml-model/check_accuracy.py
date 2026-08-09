import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder

print("=" * 50)
print("🔍 AGROLENS MODEL ACCURACY CHECK")
print("=" * 50)

# 1. Load model
print("\n📂 Loading model...")
model_data = joblib.load('models/svm_tomato_model.pkl')

if isinstance(model_data, dict):
    model = model_data['model']
    classes = model_data.get('classes', ['Early_Blight', 'Healthy', 'Late_Blight', 'Leaf_Mold'])
    print("✅ Model loaded from dictionary")
else:
    model = model_data
    classes = ['Early_Blight', 'Healthy', 'Late_Blight', 'Leaf_Mold']
    print("✅ Model loaded directly")

# 2. Load test data
print("\n📂 Loading test data...")
data = joblib.load('features/test_features.pkl')
X_test = data['features']
y_test = data['labels']

# 3. Convert labels to numbers if they are strings
if isinstance(y_test[0], str):
    le = LabelEncoder()
    y_test_encoded = le.fit_transform(y_test)
    print(f"✅ Labels converted: {le.classes_.tolist()}")
else:
    y_test_encoded = y_test

# 4. Make predictions
print("\n🔮 Making predictions...")
y_pred = model.predict(X_test)

# 5. Convert predictions to same format if needed
if isinstance(y_test[0], str) and isinstance(y_pred[0], (int, np.integer)):
    # y_pred is numbers, y_test is strings - convert y_pred to strings
    le = LabelEncoder()
    le.fit(classes)
    y_pred_decoded = le.inverse_transform(y_pred.astype(int))
    y_test_final = y_test
elif isinstance(y_test[0], (int, np.integer)) and isinstance(y_pred[0], str):
    # y_pred is strings, y_test is numbers
    le = LabelEncoder()
    le.fit(classes)
    y_test_final = y_test
    y_pred_encoded = le.transform(y_pred)
else:
    # Both are same type
    y_test_final = y_test
    y_pred_final = y_pred

# 6. Calculate metrics
if isinstance(y_test[0], str):
    # Both are strings
    y_test_final = y_test
    y_pred_final = y_pred if isinstance(y_pred[0], str) else le.inverse_transform(y_pred.astype(int))
else:
    # Both are numbers
    y_test_final = y_test
    y_pred_final = y_pred

print("\n📊 Results:")
print(f"Test samples: {len(X_test)}")
print(f"Features per sample: {X_test.shape[1]}")
print()

accuracy = accuracy_score(y_test_final, y_pred_final)
print(f"📈 ACCURACY: {accuracy * 100:.2f}%")
print()

print("📋 CLASSIFICATION REPORT:")
print(classification_report(y_test_final, y_pred_final, target_names=classes))

print("📊 CONFUSION MATRIX:")
print(confusion_matrix(y_test_final, y_pred_final))

print("\n✅ Done!")