# IntelliCart AI — Production Deployment Guide

This guide details deploying the IntelliCart AI ecosystem to production infrastructure without exposing secrets.

---

## 1. Cloud Architecture Overview

| Component | Target Platform | Build Command | Start / Run Command |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | `npm run build` | Static SPA (`dist/`) |
| **Backend REST API** | Render / Railway | `npm install` | `node server.js` |
| **AI/ML Service** | Render / Railway | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Database** | MongoDB Atlas | Managed Cluster | Replica Set URI |

---

## 2. Production Database Setup (MongoDB Atlas)

1. **Create an Atlas Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com) and create an M0 (Free) or dedicated cluster.
2. **Configure Database Access (Credentials)**:
   - Go to **Security** -> **Database Access** -> **Add New Database User**.
   - Select **Password Authentication**.
   - Create a dedicated user (e.g., `intellicart_prod_user`) with `readWriteAnyDatabase` privileges.
   - *Note*: Ensure special characters in passwords are URL-encoded if using connection strings.
3. **Configure Network Access (IP Whitelist)**:
   - Go to **Security** -> **Network Access** -> **Add IP Address**.
   - For hosting platforms with dynamic IPs (such as Render or Vercel), add `0.0.0.0/0` (Allow Access from Anywhere) with a description like `Production Cloud Hosting`.
4. **Obtain Connection String**:
   - Click **Connect** -> **Connect your application** -> Driver `Node.js`.
   - Format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/intellicart_ai?retryWrites=true&w=majority`
   - *Note*: For Windows or environments with strict UDP restrictions, standard direct replica-set host format is automatically supported by our backend `config/db.js`.

---

## 3. Backend & ML Deployment on Render (`render.yaml`)

We provide a production-ready `render.yaml` infrastructure-as-code file at the repository root.

### Steps to Deploy:
1. Push this repository to GitHub or GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New** -> **Blueprint**.
4. Connect your repository. Render automatically reads `render.yaml` and provisions:
   - `intellicart-backend` (Node.js Web Service)
   - `intellicart-ml-service` (Python Web Service)
5. Under Environment Variables for `intellicart-backend`, fill in your secrets:
   - `MONGO_URI`: Your MongoDB Atlas production URI.
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://intellicart-ai.vercel.app`).
   - `RAZORPAY_KEY_ID`: Your live/test Razorpay Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
   - `RAZORPAY_WEBHOOK_SECRET`: Your Razorpay Webhook Secret.
6. Click **Apply**. Render will build and deploy both services with integrated health checks (`/api/health` and `/ml/health`).

---

## 4. Frontend Deployment on Vercel

We provide a pre-configured `frontend/vercel.json` with SPA rewrites and production security headers.

### Steps to Deploy:
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your IntelliCart AI repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g. `https://intellicart-backend.onrender.com/api`).
   - `VITE_RAZORPAY_KEY_ID`: Your public Razorpay Key ID (`rzp_test_...` or `rzp_live_...`).
6. Click **Deploy**. Vercel will build the Vite bundle and deploy to its global edge network.

---

## 5. Docker Multi-Container Deployment

To deploy on a dedicated VPS (e.g., Ubuntu on AWS EC2, DigitalOcean, or Linode) using Docker:

1. Install Docker & Docker Compose:
   ```bash
   sudo apt-get update && sudo apt-get install -y docker.io docker-compose
   ```
2. Clone repository & configure `.env`:
   ```bash
   cp backend/.env.example backend/.env
   # Set MONGO_URI, JWT_SECRET, RAZORPAY keys
   ```
3. Run container stack:
   ```bash
   docker-compose up -d --build
   ```
4. Verify running services:
   ```bash
   docker-compose ps
   ```
   Ports exposed:
   - Port `80`: Nginx frontend reverse proxy
   - Port `5000`: Backend REST API
   - Port `8000`: FastAPI ML Microservice
   - Port `27017`: Local MongoDB container

---

## 6. Production Security Checklist

- [x] **No hardcoded secrets**: Secrets are strictly read from environment variables.
- [x] **Password hashing**: bcrypt with salt rounds 10.
- [x] **Rate limiting**: Enforced on authentication endpoints (`/api/auth/*`) and general REST endpoints.
- [x] **Cryptographic payment verification**: HMAC-SHA256 signature verification server-side.
- [x] **CORS headers**: Production origin restriction configured in `backend/app.js`.
- [x] **Safe database error handling**: In `NODE_ENV=production`, if primary database is unreachable, server safely aborts bootstrap without leaking credentials or falling back to unauthenticated local storage.
