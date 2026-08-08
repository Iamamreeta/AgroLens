"""
adapt_features.py
-------------------
Converts the already-extracted VGG16 features from AgroLens (the
train_features.npz / val_features.npz files) into the pickle format
that this repo's src/train_svm.py expects.

Run from ml-model/ folder:
    python adapt_features.py
"""

import os
import pickle
import numpy as np

SOURCE_DIR = "/Users/aakritineupane/Documents/AgroLens/backend/dataset_npz"
TARGET_DIR = "features"

LABEL_MAP = {
    0: "Early_blight",
    1: "Healthy",
    2: "Late_blight",
    3: "Leaf_mold",
}


def load_and_convert():
    os.makedirs(TARGET_DIR, exist_ok=True)

    train_features_npz = np.load(os.path.join(SOURCE_DIR, "train_features.npz"))
    val_features_npz = np.load(os.path.join(SOURCE_DIR, "val_features.npz"))

    X_train = train_features_npz["features"]
    y_train_raw = train_features_npz["labels"]

    X_val = val_features_npz["features"]
    y_val_raw = val_features_npz["labels"]

    if y_train_raw.dtype.kind in ("U", "S", "O"):
        y_train = y_train_raw
        y_val = y_val_raw
    else:
        y_train = np.array([LABEL_MAP[int(v)] for v in y_train_raw])
        y_val = np.array([LABEL_MAP[int(v)] for v in y_val_raw])

    print(f"Train: {X_train.shape[0]} samples, {X_train.shape[1]} features")
    print(f"Val:   {X_val.shape[0]} samples, {X_val.shape[1]} features")
    print(f"Classes found: {sorted(set(y_train))}")

    with open(os.path.join(TARGET_DIR, "train_features.pkl"), "wb") as f:
        pickle.dump({"features": X_train, "labels": y_train}, f)

    with open(os.path.join(TARGET_DIR, "test_features.pkl"), "wb") as f:
        pickle.dump({"features": X_val, "labels": y_val}, f)

    print(f"\nSaved to {TARGET_DIR}/train_features.pkl and {TARGET_DIR}/test_features.pkl")
    print("You can now run: python src/train_svm.py")


if __name__ == "__main__":
    load_and_convert()
