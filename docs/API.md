# MENOTIPUS Store MIS - API Documentation

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://api.menotipus.com/api/v1
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Getting a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}
```

---

## Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword",
  "role": "cashier",
  "name": "New User",
  "phone": "555-0100"
}
```

**Response:** `201 Created`

---

#### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@menotipus.com",
    "role": "admin"
  }
}
```

---

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:** `200 OK`

---

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "555-0100",
  "password": "newpassword"
}
```

---

### Users

#### List Users
```
GET /api/users
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` - Filter by role (admin, cashier, manager)
- `status` - Filter by status (active, inactive)
- `search` - Search by username, email, or name

**Response:** `200 OK`
```json
{
  "users": [...],
  "count": 10
}
```

---

#### Get User
```
GET /api/users/<id>
Authorization: Bearer <token>
```

---

#### Create User
```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword",
  "role": "cashier"
}
```

---

#### Update User
```
PUT /api/users/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "inactive",
  "role": "manager"
}
```

---

#### Delete User
```
DELETE /api/users/<id>
Authorization: Bearer <token>
```

---

### Products

#### List Products
```
GET /api/products
Authorization: Bearer <token>
```

**Query Parameters:**
- `category` - Filter by category
- `status` - Filter by status
- `search` - Search by name, SKU, or barcode
- `low_stock` - Filter low stock items (true/false)
- `supplier_id` - Filter by supplier

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "category": "Category",
      "sku": "SKU-001",
      "selling_price": 19.99,
      "cost_price": 10.00,
      "stock": 100,
      "min_stock": 10,
      "is_low_stock": false
    }
  ],
  "count": 1
}
```

---

#### Create Product
```
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Product",
  "category": "Electronics",
  "selling_price": 99.99,
  "cost_price": 50.00,
  "stock": 100,
  "min_stock": 10,
  "supplier_id": 1,
  "description": "Product description"
}
```

---

#### Update Product
```
PUT /api/products/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "selling_price": 89.99,
  "stock": 150
}
```

---

#### Update Stock
```
PUT /api/products/<id>/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "stock": 500
}
```

---

#### Adjust Stock
```
POST /api/products/<id>/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "adjustment": 50,
  "reason": "New shipment received"
}
```

---

#### Get Low Stock Products
```
GET /api/products/low-stock
Authorization: Bearer <token>
```

---

#### Get Categories
```
GET /api/products/categories
Authorization: Bearer <token>
```

---

### Sales

#### List Sales
```
GET /api/sales
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` - Filter from date (YYYY-MM-DD)
- `end_date` - Filter to date (YYYY-MM-DD)
- `user_id` - Filter by cashier
- `store_id` - Filter by store
- `payment_method` - Filter by payment method

---

#### Create Sale
```
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 19.99
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 29.99
    }
  ],
  "payment_method": "cash",
  "discount": 5.00,
  "store_id": 1
}
```

**Response:** `201 Created`
```json
{
  "sale": {
    "id": 1,
    "invoice_number": "INV-20240101123456-ABCD",
    "subtotal": 69.97,
    "discount": 5.00,
    "total": 64.97,
    "payment_method": "cash",
    "items": [...]
  }
}
```

---

#### Get Sale
```
GET /api/sales/<id>
Authorization: Bearer <token>
```

---

#### Cancel Sale
```
DELETE /api/sales/<id>
Authorization: Bearer <token>
```

---

#### Process Refund
```
POST /api/sales/<id>/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [1, 2]
}
```

---

#### Get Today's Sales
```
GET /api/sales/today
Authorization: Bearer <token>
```

---

#### Get Sales Statistics
```
GET /api/sales/stats
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` - From date
- `end_date` - To date

---

### Stores

#### List Stores
```
GET /api/stores
Authorization: Bearer <token>
```

---

#### Create Store
```
POST /api/stores
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Store",
  "code": "STORE-001",
  "address": "123 Main St",
  "phone": "555-0100",
  "email": "store@example.com"
}
```

---

### Suppliers

#### List Suppliers
```
GET /api/suppliers
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status
- `search` - Search by name, email, phone

---

#### Create Supplier
```
POST /api/suppliers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Supplier Name",
  "email": "supplier@example.com",
  "phone": "555-0100",
  "address": "456 Supplier Ave",
  "contact_person": "John Doe"
}
```

---

### Dashboard

#### Get Dashboard Statistics
```
GET /api/dashboard
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "statistics": {
    "total_sales": 10000.00,
    "today_sales": 500.00,
    "total_products": 150,
    "low_stock_products": 5,
    "total_users": 10,
    "active_cashiers": 3
  },
  "recent_sales": [...]
}
```

---

#### Get Analytics
```
GET /api/analytics
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "sales_trend": [
    {"date": "2024-01-01", "total": 1000, "count": 10}
  ],
  "top_products": [
    {"id": 1, "name": "Product", "total_sold": 100}
  ],
  "category_performance": [
    {"category": "Electronics", "total_sold": 500, "total_revenue": 5000}
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Account is not active"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
