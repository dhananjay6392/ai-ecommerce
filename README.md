# IntelliCart AI — Autonomous AI-Driven E-Commerce Platform

IntelliCart AI is a comprehensive, production-grade, enterprise AI-powered e-commerce ecosystem. The platform seamlessly integrates a high-performance web storefront, a standalone native Android/iOS mobile application, a scalable Node.js/Express REST API backend, and an autonomous Python FastAPI Machine Learning microservice.

---

## Architecture Overview

```
                                  ┌──────────────────────────────────────────────────┐
                                  │           Client Applications                    │
                                  │  • Web: React 18 + Vite + TailwindCSS            │
                                  │  • Mobile: React Native + Expo SDK 57 (Android)  │
                                  └───────────────┬───────────────────┬──────────────┘
                                                  │                   │
                                                  │ HTTPS / REST API  │
                                                  ▼                   ▼
                                  ┌──────────────────────────────────────────────────┐
                                  │          Node.js Express REST API Backend        │
                                  │  • JWT Auth & RBAC (Customer / Admin)            │
                                  │  • Catalog, Cart, Wishlist, Order Management     │
                                  │  • Razorpay Payment Gateway & Cryptographic Sig  │
                                  └───────────────┬───────────────────┬──────────────┘
                                                  │                   │
                                   Mongoose / DB  │                   │ HTTP Internal Proxy
                                                  ▼                   ▼
                                  ┌───────────────────┐    ┌─────────────────────────┐
                                  │   MongoDB Server  │    │ FastAPI ML Microservice │
                                  │    (Port 27017)   │    │       (Port 8000)       │
                                  │                   │    │ • TF-IDF + Collab Recs  │
                                  │                   │    │ • DistilBERT Sentiment  │
                                  │                   │    │ • Demand Forecasting    │
                                  └───────────────────┘    └─────────────────────────┘
```

---

## Repository Structure

```
.
├── backend/            # Node.js & Express REST API (Auth, Orders, Payments, Mongoose models)
├── frontend/           # Modern React + Vite web storefront with dark/light themes & admin dashboard
├── ml-service/         # FastAPI microservice for recommendations, sentiment analysis & forecasting
├── mobile-app/         # Standalone Expo SDK 57 React Native application with EAS APK build support
├── research/           # Empirical evaluation scripts, benchmark datasets & research papers
├── docs/               # System documentation, API contracts & research papers
├── docker-compose.yml  # Multi-container orchestration (MongoDB, Backend, ML Engine, Frontend)
└── start-services.ps1  # Native 1-click Windows PowerShell local service launcher
```

---

## Core Features

### 1. Autonomous Machine Learning Engine
- **Hybrid Recommendation Engine**: Blends content-based TF-IDF cosine similarity with collaborative filtering matrix factorization.
- **Sentiment Analysis**: NLP pipeline classifying user review sentiments and calculating authenticity scores.
- **Demand Forecasting**: Predictive demand modeling analyzing seasonal trends, price elasticity, and stock reorder triggers.

### 2. Standalone Native Mobile App (`mobile-app/`)
- Native **Expo SDK 57** architecture with Hermes engine.
- Complete shopping experience: Interactive catalog, real-time AI picks, cart/wishlist sync, and order tracking timeline.
- Built-in **Razorpay Test Mode simulator** verifying backend cryptographic signatures.
- **Runtime Server Diagnostics Screen**: Allows switching API endpoints (emulator `10.0.2.2`, local LAN Wi-Fi `192.168.X.X`, or cloud HTTPS) without recompiling.

### 3. Web Storefront & Admin Portal (`frontend/`)
- Sleek glassmorphism UI built with **React**, **Vite**, and **TailwindCSS**.
- Customer view: Hero banners, AI recommendations carousel, full-text search, live filtering.
- Dedicated Admin Dashboard: Sales analytics, demand prediction graphs, order status transitions, and inventory alerts.

### 4. Robust Backend & Payments (`backend/`)
- JWT authentication with HTTP-only cookies and Bearer tokens for mobile clients.
- Resilient MongoDB connection with automatic fallback.
- Razorpay order creation and webhook signature validation (`/api/payments/verify`).
- Idempotency key tracking on order placements to prevent duplicate charges.

---

## Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.10 to v3.12 recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or MongoDB Atlas connection string)

---

### Method A: 1-Click Launch (Windows PowerShell)

Run the automated launcher script from the root directory:
```powershell
.\start-services.ps1
```
This automatically starts:
- **MongoDB** (Port 27017)
- **FastAPI ML Microservice** (Port 8000)
- **Express REST Backend** (Port 5000)
- **Vite React Web Frontend** (Port 5173)

---

### Method B: Manual Startup

#### 1. Start the Backend API
```bash
cd backend
npm install
npm run seed     # Seeds demo products, categories, and test accounts
npm run dev      # Starts on http://localhost:5000
```

#### 2. Start the FastAPI ML Engine
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Start the Web Storefront
```bash
cd frontend
npm install
npm run dev      # Starts on http://localhost:5173
```

#### 4. Start the Mobile Application
```bash
cd mobile-app
npx expo start
```
- Press `a` in the terminal to launch in an **Android Emulator**.
- Scan the QR code using the **Expo Go** app on a physical iOS/Android phone.

---

### Default Test Credentials

| Account Role | Email Address | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@intellicart.com` | `Admin@123456` |
| **Demo Customer** | `customer@intellicart.com` | `Customer@123456` |

---

## Docker Deployment

To spin up the entire stack using Docker Compose:
```bash
docker-compose up --build -d
```
All services will initialize with automatic health checks and inter-service networking.

---

## Building Standalone Android APK

Configure `mobile-app/eas.json` and build an installable APK via EAS:
```bash
cd mobile-app
npx eas-cli login
npx eas-cli build -p android --profile preview
```

---

## License

This project is licensed under the MIT License. See [LICENSE](file:///c:/Users/vivek/OneDrive/Desktop/AI%20E-Commerce/mobile-app/LICENSE) for details.
