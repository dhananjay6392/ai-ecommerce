import sys
import os
import json
import pandas as pd
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

sys.path.append(os.path.abspath("ml-service"))
from sentiment.classifier import SentimentClassifier

df = pd.read_csv("research/datasets/customer_reviews_labeled.csv")
classifier = SentimentClassifier()

predictions = []
for _, row in df.iterrows():
    pred = classifier.predict(row["text"], row["star_rating"])
    predictions.append(pred["sentiment"])

y_true = df["ground_truth"].tolist()
y_pred = predictions

classes = ["Positive", "Neutral", "Negative"]

acc = accuracy_score(y_true, y_pred)
prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="macro")
cm = confusion_matrix(y_true, y_pred, labels=classes)

results = {
    "accuracy": round(float(acc), 4),
    "macro_precision": round(float(prec), 4),
    "macro_recall": round(float(rec), 4),
    "macro_f1": round(float(f1), 4),
    "classes": classes,
    "confusion_matrix": cm.tolist(),
}

with open("research/results/sentiment_benchmarks.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n=== REVIEW SENTIMENT NLP EVALUATION RESULTS ===")
print(f"Accuracy:         {acc:.4f} ({acc*100:.2f}%)")
print(f"Macro Precision:  {prec:.4f}")
print(f"Macro Recall:     {rec:.4f}")
print(f"Macro F1-Score:   {f1:.4f}")
print("\nConfusion Matrix (Rows: True, Cols: Pred):")
print(f"Classes: {classes}")
print(cm)
