import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

df = pd.read_csv("research/datasets/weekly_sales_demand.csv")

features = ["price", "discount", "sales_lag_7", "sales_lag_30", "rating"]
X = df[features]
y = df["units_sold"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

models = {
    "Linear Regression (Baseline)": LinearRegression(),
    "Ridge Regression (L2)": Ridge(alpha=1.0),
    "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42),
    "Gradient Boosting (IntelliCart SOTA)": GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, random_state=42),
}

results = []

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    mape = np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 1))) * 100

    results.append({
        "Model": name,
        "MAE": round(mae, 3),
        "RMSE": round(rmse, 3),
        "MAPE (%)": round(mape, 2),
        "R2 Score": round(r2, 4),
    })

results_df = pd.DataFrame(results)
results_df.to_csv("research/results/demand_benchmarks.csv", index=False)

print("\n=== DEMAND FORECASTING BENCHMARK RESULTS (IEEE COMPARATIVE TABLE) ===")
print(results_df.to_string(index=False))
