# IntelliCart AI — REST API Documentation

Base URL: `http://localhost:5000/api` (Development) / `https://api.yourdomain.com/api` (Production)

---

## 1. Authentication & Users

### POST `/auth/register`
Create a new customer account.
- **Access**: Public
- **Rate Limit**: 60 req / 15 min
- **Request Body**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "password": "Customer@123456",
    "confirmPassword": "Customer@123456"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "Alex Rivera", "email": "alex@example.com", "role": "CUSTOMER" }
  }
  ```

### POST `/auth/login`
Authenticate existing user and retrieve JWT.
- **Access**: Public
- **Rate Limit**: 60 req / 15 min
- **Request Body**:
  ```json
  { "email": "alex@example.com", "password": "Customer@123456" }
  ```

### GET `/auth/me`
Retrieve profile of currently authenticated user.
- **Access**: Private (Bearer Token or Cookie)

### PUT `/users/profile`
Update user profile information (name, phone, address).
- **Access**: Private

---

## 2. Products & Categories

### GET `/products`
Search and filter products catalog.
- **Access**: Public
- **Query Parameters**:
  - `search`: Keyword string matching title, brand, description, tags
  - `category`: Category slug or ObjectId
  - `brand`: Brand name or comma-separated list
  - `minPrice`, `maxPrice`: Numerical price boundaries
  - `rating`: Minimum customer star rating (1-5)
  - `inStock`: Boolean (`true` filters out 0-stock SKUs)
  - `sort`: `featured`, `price-asc`, `price-desc`, `rating`, `newest`, `popular`
  - `page`, `limit`: Pagination controls

### GET `/products/:id`
Retrieve single product details with populated category and virtual `finalPrice`.
- **Access**: Public

### POST `/products` (Admin Only)
Create new catalog SKU.
- **Access**: Private/Admin
- **Request Body**:
  ```json
  {
    "name": "AeroPulse ANC Pro",
    "brand": "SonicWave",
    "category": "670100000000000000000001",
    "price": 14999,
    "discountPercentage": 15,
    "stock": 45,
    "description": "Studio-grade ANC headphones.",
    "thumbnail": "https://images.unsplash.com/...",
    "tags": ["audio", "wireless", "anc"]
  }
  ```

### PUT `/products/:id` (Admin Only)
Update product details and stock levels.

### DELETE `/products/:id` (Admin Only)
Delete product from catalog.

### GET `/categories`
List all active categories with dynamically aggregated `productCount`.

### POST `/categories` (Admin Only)
Create new category (`name`, `slug`, `description`, `image`).

---

## 3. Shopping Cart & Wishlist

### GET `/cart`
Fetch current authenticated user's cart with synchronized stock availability and latest prices.

### POST `/cart`
Add product to cart or increment quantity.
- **Body**: `{ "productId": "...", "quantity": 1 }`

### PUT `/cart/:productId`
Update item quantity. Validates against available real-time stock.

### DELETE `/cart/:productId`
Remove SKU from cart.

### DELETE `/cart`
Clear all items from active cart.

### GET `/wishlist`
Retrieve user's saved wishlist items.

### POST `/wishlist/:productId`
Add product to wishlist.

### DELETE `/wishlist/:productId`
Remove product from wishlist.

### POST `/wishlist/:productId/move-to-cart`
Atomically move product from wishlist into cart.

---

## 4. Orders & Payments

### POST `/orders`
Place a new order. Validates stock, locks prices, deducts stock atomically, and clears cart.
- **Headers**: `idempotency-key` (optional, protects against duplicate submission)
- **Body**:
  ```json
  {
    "shippingAddress": {
      "fullName": "Alex Rivera",
      "street": "42 Silicon Avenue",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560100",
      "country": "India"
    },
    "paymentMethod": "RAZORPAY"
  }
  ```

### GET `/orders`
List logged-in user's orders sorted by newest first.

### GET `/orders/:id`
Get detailed order status. Restricted to order owner or administrator.

### PUT `/orders/:id/cancel`
Cancel order and immediately restore reserved inventory stock.

### POST `/payments/create-order`
Initiate Razorpay server order with verified amount matching database order.

### POST `/payments/verify`
Server-side HMAC-SHA256 signature verification. Confirms payment, marks order PAID, and logs interaction for AI recommendations.

### POST `/payments/fail`
Handle client payment dismissals or card errors, automatically restoring reserved inventory.

---

## 5. Machine Learning Services

### GET `/ml/recommendations`
Retrieve hybrid AI recommendations based on viewed product ID or user's implicit history.

### GET `/ml/inventory-intelligence` (Admin Only)
Real-time safety stock computation, reorder points (ROP), and monthly velocity forecasts.

### GET `/ml/sentiment-overview` (Admin Only)
Customer review sentiment analysis, polarity breakdown, and discrepancy detection.

### GET `/ml/benchmarks`
Empirical IEEE research evaluation metrics for recommendation accuracy, demand regression, and NLP sentiment classification.

---

## 6. Admin Management & Analytics

### GET `/orders/analytics` (Admin Only)
Sales analytics: total revenue, order count, customer count, 14-day daily revenue chart, low-stock alerts, and top products.

### GET `/admin/orders` (Admin Only)
Full administrative view of all customer orders.

### PUT `/admin/orders/:id/status` (Admin Only)
Update order status (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). Automatically handles stock restoral if cancelled.

### GET `/admin/users` (Admin Only)
List registered users with search, role filter (`ALL`, `CUSTOMER`, `ADMIN`), and status filter (`active`, `inactive`).

### PUT `/admin/users/:id/status` (Admin Only)
Toggle user active/inactive state. Safeguarded against deactivating the last active administrator.
