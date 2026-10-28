import os
import subprocess
import sys

print("==========================================================")
print("   IntelliCart AI — IEEE Academic Experiment Pipeline     ")
print("==========================================================")

python_exe = sys.executable

# 1. Dataset Generation
print("\n[Step 1/4] Generating Benchmark Datasets...")
subprocess.run([python_exe, "research/generate_datasets.py"], check=True)

# 2. Demand Forecasting
print("\n[Step 2/4] Evaluating Demand Forecasting Multi-Variable Regressors...")
subprocess.run([python_exe, "research/evaluate_demand_forecasting.py"], check=True)

# 3. Recommendation Evaluation
print("\n[Step 3/4] Benchmarking Top-K Ranking Recommender Algorithms...")
subprocess.run([python_exe, "research/evaluate_recommendations.py"], check=True)

# 4. Review Sentiment NLP
print("\n[Step 4/4] Evaluating Customer Review Sentiment Classifier...")
subprocess.run([python_exe, "research/evaluate_sentiment.py"], check=True)

print("\n==========================================================")
print("   All Empirical Benchmarks Executed & Saved to Results!  ")
print("   Files Generated:                                       ")
print("   • research/results/demand_benchmarks.csv               ")
print("   • research/results/recsys_benchmarks.csv               ")
print("   • research/results/sentiment_benchmarks.json           ")
print("==========================================================")
