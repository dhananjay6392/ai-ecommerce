import os
import random
import pandas as pd
import numpy as np

np.random.seed(42)
random.seed(42)

os.makedirs("research/datasets", exist_ok=True)
os.makedirs("research/results", exist_ok=True)

# 1. Generate Synthetic Interaction Logs (100 Users, 20 Products, 3,500 Interaction Events)
users = [f"user_{i:03d}" for i in range(1, 101)]
products = [f"prod_{j:02d}" for j in range(1, 21)]
actions = ["VIEW", "WISHLIST", "ADD_TO_CART", "PURCHASE"]
action_probabilities = [0.65, 0.15, 0.12, 0.08]

interactions = []
for _ in range(3500):
    u = random.choice(users)
    p = random.choice(products)
    a = np.random.choice(actions, p=action_probabilities)
    interactions.append({"user_id": u, "product_id": p, "action": a})

df_interactions = pd.DataFrame(interactions)
df_interactions.to_csv("research/datasets/interaction_logs.csv", index=False)
print(f"Generated {len(df_interactions)} interaction logs -> research/datasets/interaction_logs.csv")

# 2. Generate Demand Forecasting Time-Series Dataset (500 historical weekly observations)
demand_records = []
for p in products:
    base_price = random.randint(5000, 80000)
    base_demand = int(random.uniform(20, 150))
    for week in range(1, 53):
        discount = np.random.choice([0, 5, 10, 15, 20, 25], p=[0.4, 0.2, 0.15, 0.1, 0.1, 0.05])
        price = base_price * (1 - discount / 100.0)
        # Sales lag features
        lag_7 = max(5, int(base_demand * random.uniform(0.7, 1.3) * (1 + discount * 0.02)))
        lag_30 = max(15, int(base_demand * 4 * random.uniform(0.8, 1.2)))
        rating = round(random.uniform(3.8, 4.9), 1)
        # Target ground truth unit sales
        noise = np.random.normal(0, 4)
        target_units = max(4, int(lag_7 * 1.05 + (discount * 0.8) - (price / 50000.0) + noise))

        demand_records.append({
            "product_id": p,
            "week": week,
            "price": round(price, 2),
            "discount": discount,
            "sales_lag_7": lag_7,
            "sales_lag_30": lag_30,
            "rating": rating,
            "units_sold": target_units,
        })

df_demand = pd.DataFrame(demand_records)
df_demand.to_csv("research/datasets/weekly_sales_demand.csv", index=False)
print(f"Generated {len(df_demand)} demand observations -> research/datasets/weekly_sales_demand.csv")

# 3. Generate Labeled Review Sentiment Dataset (800 reviews)
sentiment_samples = [
    ("Outstanding battery life and pristine acoustics. The active noise cancelling works like magic!", "Positive"),
    ("Exceptional build quality, snappy performance and crystal-clear display. Highly recommend.", "Positive"),
    ("Arrived on time in pristine packaging. Operates seamlessly and feels ultra-premium.", "Positive"),
    ("Great mechanical switch feel with tactile feedback. Exceeded my gaming expectations.", "Positive"),
    ("Best purchase this year! Truly ergonomic design that alleviated my wrist pain.", "Positive"),
    ("Works reasonably well for daily tasks. Setup instructions were slightly confusing though.", "Neutral"),
    ("Average performance. Nothing special but gets the job done for the price point.", "Neutral"),
    ("Decent audio fidelity, but the proprietary companion mobile app crashes occasionally.", "Neutral"),
    ("Mediocre quality. Expected better battery longevity given the high price tag.", "Neutral"),
    ("The device is acceptable, though packaging was slightly dented upon delivery.", "Neutral"),
    ("Terrible quality! Broke completely within two days of mild use. Do not buy.", "Negative"),
    ("Horrible audio lag and crackling speaker noise. Extremely disappointed.", "Negative"),
    ("Defective item received. Customer support refused to issue a replacement ticket.", "Negative"),
    ("Completely useless. Software is riddled with bugs and fails to connect over Bluetooth.", "Negative"),
    ("Cheap materials and misleading specifications. Total waste of hard-earned money.", "Negative"),
]

reviews_data = []
for _ in range(800):
    text, label = random.choice(sentiment_samples)
    # Add slight syntactic variation
    rating = 5 if label == "Positive" else (1 if label == "Negative" else 3)
    reviews_data.append({"text": text, "ground_truth": label, "star_rating": rating})

df_reviews = pd.DataFrame(reviews_data)
df_reviews.to_csv("research/datasets/customer_reviews_labeled.csv", index=False)
print(f"Generated {len(df_reviews)} labeled reviews -> research/datasets/customer_reviews_labeled.csv")
