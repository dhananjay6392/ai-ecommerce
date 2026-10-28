from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"

def test_health_check():
    response = client.get("/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["models_loaded"]["hybrid_recommender"] is True

def test_sentiment_positive():
    response = client.post(
        "/ml/sentiment/predict",
        json={"text": "Outstanding noise cancellation, crisp audio and superb build quality!", "rating": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] == "Positive"
    assert data["sentiment_score"] > 0

def test_sentiment_negative():
    response = client.post(
        "/ml/sentiment/predict",
        json={"text": "Terrible product, broke after 2 days. Complete waste of money.", "rating": 1}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] == "Negative"
    assert data["sentiment_score"] < 0

def test_demand_forecasting():
    response = client.post(
        "/ml/demand/predict",
        json={
            "price": 18999,
            "discount": 15,
            "sales_lag_7": 30,
            "sales_lag_30": 110,
            "current_stock": 8,
            "rating": 4.8
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_demand"] > 0
    assert "safety_stock" in data
    assert "reorder_point" in data
    assert data["stock_status"] in ["ADEQUATE", "LOW_STOCK", "CRITICAL_REORDER"]

def test_recommendation_content():
    response = client.post(
        "/ml/recommendations",
        json={"product_id": "670100000000000000000001", "limit": 4}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["recommendations"]) > 0

def test_research_benchmarks():
    response = client.get("/ml/research/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert "recommendation_metrics" in data
    assert "demand_forecasting_metrics" in data
    assert "sentiment_analysis_metrics" in data
