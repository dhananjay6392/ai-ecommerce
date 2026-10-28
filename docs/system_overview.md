# IntelliCart AI — Full Stack Implementation & Operational Guide

## System Status: 100% Operational

All services are running locally and integrated:
1. **Frontend Client**: [http://localhost:5173](http://localhost:5173) (React 19 + Vite 6 + Tailwind CSS)
2. **Backend API Gateway**: [http://localhost:5000](http://localhost:5000) (Node.js 24 + Express + MongoDB)
3. **ML Microservice Engine**: [http://localhost:8000](http://localhost:8000) (Python 3.14 + FastAPI + Scikit-Learn)

---

### Demo Accounts & Instant Logins

Use the one-click demo login buttons in the Sign In modal or enter:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `alex@example.com` | `Customer@123456` | Personalized recommendations, cart, wishlist, checkout, order tracking |
| **Administrator** | `admin@intellicart.com` | `Admin@123456` | Admin AI Dashboard, demand forecasting, safety stock alerts, IEEE metrics |

---

### Key Architectural Modules Implemented

1. **Hybrid Recommendation Engine** (`ml-service/recommendation/engine.py` & `/api/ml/recommendations`):
   - Computes TF-IDF cosine similarity across catalog product vectors.
   - Merges implicit collaborative feedback weights (`PURCHASE`: 5x, `ADD_TO_CART`: 3x, `WISHLIST`: 2x, `VIEW`: 1x).
   - Generates transparent reason tags and confidence match percentages.

2. **Demand Forecasting & Smart Inventory Alerts** (`ml-service/demand_prediction/model.py` & `/api/ml/inventory-intelligence`):
   - Multi-feature Gradient Boosting regression predicting monthly SKU velocity.
   - Dynamic Safety Stock ($SS = Z \times \sigma_L \times \sqrt{L}$) at 95% service level ($Z = 1.65$).
   - Automated Reorder Points ($ROP$) with `CRITICAL_REORDER`, `LOW_STOCK`, and `ADEQUATE` classifications.

3. **Customer Review Sentiment Classifier** (`ml-service/sentiment/classifier.py` & `/api/reviews`):
   - Lexicon-augmented supervised NLP pipeline predicting positive, neutral, or negative polarity.
   - Real-time sentiment distribution charts and discrepancy detection.

4. **Cryptographic Payment Gateway** (`backend/services/paymentService.js` & `/api/payments`):
   - Server-side Razorpay order generation.
   - HMAC-SHA256 signature verification preventing price or parameter tampering.
   - Atomic database inventory stock decrement upon confirmed payment.

5. **Admin AI Intelligence Portal** (`/admin`):
   - Interactive Recharts visualizations: Stock vs Predicted Demand vs ROP.
   - Review sentiment distribution donut chart.
   - IEEE academic evaluation benchmarks (Precision@5, Recall@5, MAP, Hit-Rate, MAE, RMSE, R²).
