# IntelliCart AI — Standalone Android Mobile Application

IntelliCart AI Mobile is a high-performance native shopping application built with **React Native** and **Expo SDK 57**, connected directly to the existing IntelliCart AI Node.js/Express backend and FastAPI Machine Learning microservice.

---

## Architecture Overview

```
                               ┌────────────────────────────────┐
                               │     IntelliCart Mobile App     │
                               │  (React Native / Expo SDK 57)  │
                               └───────────────┬────────────────┘
                                               │
                       HTTPS / REST API (JWT & Bearer Tokens)
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │  Node.js Express REST Backend  │
                               │          (Port 5000)           │
                               └───────┬────────────────┬───────┘
                                       │                │
                        Mongoose / DB  │                │ HTTP Proxy
                                       ▼                ▼
                          ┌─────────────────┐    ┌─────────────────┐
                          │     MongoDB     │    │ FastAPI ML Svc  │
                          │   (Port 27017)  │    │   (Port 8000)   │
                          └─────────────────┘    └─────────────────┘
```

---

## Key Features

1. **AI Recommendations**: Powered by the FastAPI microservice (`/api/ml/recommendations`), combining TF-IDF content similarity and collaborative filtering.
2. **Dynamic Search & Catalog**: Fast category filtering, sort by price/rating/newest, and real-time product search.
3. **Cart & Wishlist Synchronization**: Real-time cart state calculation, free shipping progress bar, and 1-tap wishlist-to-cart migration.
4. **Interactive Razorpay Test Mode**: Built-in payment gateway simulator supporting cryptographic signature verification (`/api/payments/verify`) without exposing secret keys.
5. **Runtime Server Diagnostics**: Built-in network screen allowing testers to verify API connectivity and change backend URLs directly on physical Android phones.
6. **Dark & Luminous Design**: Custom theme with high-contrast obsidian slate surfaces, electric indigo accents, and neon cyan badges.

---

## Configuration & Environment Variables

Create `.env` inside `mobile-app/`:

```env
# Public Backend REST API URL
# - Local Android Emulator: http://10.0.2.2:5000/api
# - Local Physical Device (Same Wi-Fi): http://192.168.1.X:5000/api
# - Cloud / Distributed APK: https://api.yourdomain.com/api
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api

# Razorpay Test Key ID (Client-side public key)
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder_key
```

> **Security Note:** Secrets such as `JWT_SECRET`, `MONGO_URI`, and `RAZORPAY_KEY_SECRET` reside strictly on the server backend and are **never** bundled into the client APK.

---

## Building the Standalone Android APK

EAS Build is configured in `eas.json` with `buildType: "apk"` under the `preview` and `production-apk` profiles:

### 1. Authenticate with Expo
An Expo account is required to generate the build on EAS cloud infrastructure:
```bash
cd mobile-app
npx eas-cli login
```

### 2. Run the APK Build Command
Execute the exact command below to compile the installable APK:
```bash
npx eas-cli build -p android --profile preview
```

### 3. Where the Generated APK is Available
When the build completes:
1. The EAS terminal CLI outputs a **direct download URL** ending in `.apk`.
2. A QR code is generated in the console for scanning directly from your Android phone.
3. The build is available in your Expo dashboard at:
   `https://expo.dev/accounts/[YOUR_USERNAME]/projects/intellicart-ai/builds`

---

## Preserving Signing Credentials for Updates

To distribute updates to users who already installed the APK without causing Android signature conflicts (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`):

1. **Automatic EAS Management:**
   When you run `eas build` for the first time, allow EAS to generate and securely store your Android keystore on Expo's encrypted servers.
2. **Export Keystore for Backup:**
   ```bash
   npx eas-cli credentials -p android
   ```
   Select **Keystore** > **Download keystore**.
3. **Future Builds:**
   All future updates built with `npx eas-cli build -p android --profile preview` will automatically use this same keystore, enabling seamless in-place app updates on users' devices.

---

## Sideloading & Testing on Physical Devices

1. Send the generated `.apk` file to the target Android phone (via Google Drive, WhatsApp, USB, or download link).
2. On Android, open the APK file.
3. When prompted:
   - Enable **"Allow from this source"** in Android Settings > Apps > Special app access > Install unknown apps.
4. Tap **Install** and launch **IntelliCart AI**.
5. Go to **Account** > **Backend Server URL & Diagnostics** to test network ping and confirm `ONLINE` status.
