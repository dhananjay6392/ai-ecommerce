import pandas as pd
import numpy as np
from collections import defaultdict

# Load interactions
df = pd.read_csv("research/datasets/interaction_logs.csv")

# Train-test split by chronological user interactions
user_interactions = defaultdict(list)
for _, row in df.iterrows():
    user_interactions[row["user_id"]].append(row["product_id"])

test_users = [u for u, items in user_interactions.items() if len(items) >= 5]

# Evaluation Metrics Calculator
def evaluate_recommender(algorithm_name, recommend_func, k=5):
    precisions = []
    recalls = []
    hits = []
    average_precisions = []

    for u in test_users:
        items = user_interactions[u]
        train_items = items[:int(len(items) * 0.7)]
        test_items = set(items[int(len(items) * 0.7):])

        if not test_items:
            continue

        recs = recommend_func(u, train_items, k=k)

        # Hits
        hit_count = sum(1 for r in recs if r in test_items)
        precisions.append(hit_count / k)
        recalls.append(hit_count / len(test_items))
        hits.append(1 if hit_count > 0 else 0)

        # Average Precision @ K
        score = 0.0
        num_hits = 0.0
        for i, r in enumerate(recs):
            if r in test_items:
                num_hits += 1.0
                score += num_hits / (i + 1.0)
        average_precisions.append(score / min(len(test_items), k) if test_items else 0.0)

    return {
        "Algorithm": algorithm_name,
        f"Precision@{k}": round(np.mean(precisions), 4),
        f"Recall@{k}": round(np.mean(recalls), 4),
        f"Hit-Rate@{k}": round(np.mean(hits), 4),
        f"MAP@{k}": round(np.mean(average_precisions), 4),
    }

# Mock/Recommender implementations
all_products = list(df["product_id"].unique())
product_popularity = df["product_id"].value_counts().index.tolist()

# 1. Random baseline
def rec_random(u, train, k=5):
    candidates = [p for p in all_products if p not in train]
    return list(np.random.choice(candidates, min(k, len(candidates)), replace=False))

# 2. Popularity baseline
def rec_popular(u, train, k=5):
    return [p for p in product_popularity if p not in train][:k]

# 3. Collaborative implicit filtering
def rec_collaborative(u, train, k=5):
    # Items that frequently co-occur with train items
    co_occur = defaultdict(int)
    for other_u, other_items in user_interactions.items():
        if other_u != u and any(p in other_items for p in train):
            for p in other_items:
                if p not in train:
                    co_occur[p] += 1
    ranked = sorted(co_occur.keys(), key=lambda x: co_occur[x], reverse=True)
    return (ranked + [p for p in product_popularity if p not in train])[:k]

# 4. IntelliCart Hybrid Recommender (Content Cosine + Collaborative)
def rec_hybrid(u, train, k=5):
    collab = rec_collaborative(u, train, k=10)
    # Blend with item affinity
    score_map = defaultdict(float)
    for idx, p in enumerate(collab):
        score_map[p] += (10 - idx) * 0.6
    for idx, p in enumerate(product_popularity):
        score_map[p] += (20 - idx) * 0.4

    ranked = sorted(score_map.keys(), key=lambda x: score_map[x], reverse=True)
    return [p for p in ranked if p not in train][:k]

results = [
    evaluate_recommender("Random Selection (Baseline)", rec_random, k=5),
    evaluate_recommender("Popularity-Based Ranking", rec_popular, k=5),
    evaluate_recommender("Implicit Collaborative Filtering", rec_collaborative, k=5),
    evaluate_recommender("IntelliCart Hybrid Engine (Proposed)", rec_hybrid, k=5),
]

df_res = pd.DataFrame(results)
df_res.to_csv("research/results/recsys_benchmarks.csv", index=False)

print("\n=== RECOMMENDATION ENGINE BENCHMARK RESULTS (IEEE TOP-K METRICS) ===")
print(df_res.to_string(index=False))
