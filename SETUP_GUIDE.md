# IntelliCart AI — Local Setup & Development Guide

Follow this step-by-step guide to run the complete IntelliCart AI system on your local machine.

---

## 1. System Requirements

- **Node.js**: v18.0.0 or higher (Node 20+ recommended)
- **Python**: v3.10 to v3.14
- **MongoDB**: Local MongoDB Community Server running on `mongodb://localhost:27017` OR a MongoDB Atlas cluster URI
- **Git**

---

## 2. Environment Configuration

Copy the example environment files for each service:

### Backend Configuration (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Key variables:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/intellicart_ai
JWT_SECRET=super_secret_jwt_key_intellicart_2026_ieee
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
RAZORPAY_KEY_ID=rzp_test_placeholder_key
RAZORPAY_KEY_SECRET=placeholder_secret_key
RAZORPAY_WEBHOOK_SECRET=placeholder_webhook_secret
```

### Frontend Configuration (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
```ini
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder_key
```

### Mobile App Configuration (`mobile-app/.env`):
```bash
cp mobile-app/.env.example mobile-app/.env
```
```ini
# Android Emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api

# Physical Device on same Wi-Fi:
# EXPO_PUBLIC_API_URL=http://192.168.1.X:5000/api

EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder_key
```

### ML Service Configuration (`ml-service/.env`):
```ini
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
```

---

## 3. Automated 1-Click Launch (Windows PowerShell)

Run the root automation script:
```powershell
.\start-services.ps1
```
This script checks MongoDB, launches the FastAPI ML Engine on port 8000, starts the Express Backend on port 5000, and starts Vite on port 5173.

---

## 4. Manual Launch (Individual Services)

### 4.1 Step 1: Database Seeding
Ensure MongoDB is running, then populate demo categories, products, orders, and users:
```bash
cd backend
npm install
npm run seed
```

### 4.2 Step 2: Start Backend REST API
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:5000`. Test via:
```bash
curl http://localhost:5000/api/health
```

### 4.3 Step 3: Start Python ML Microservice
```bash
cd ml-service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
ML microservice will start on `http://localhost:8000`. Test via:
```bash
curl http://localhost:8000/ml/health
```

### 4.4 Step 4: Start Frontend Web Client
```bash
cd frontend
npm install
npm run dev
```
Open browser at `http://localhost:5173`.

### 4.5 Step 5: Start Mobile App (Optional)
```bash
cd mobile-app
npm install
npx expo start
```
Scan the QR code with Expo Go on Android/iOS or press `a` for Android Emulator.

---

## 5. Demo Accounts

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `alex@example.com` | `Customer@123456` | Recommendations, cart, wishlist, checkout, orders |
| **Administrator** | `admin@intellicart.com` | `Admin@123456` | Full Admin Dashboard, sales charts, inventory intelligence, product & user management |
