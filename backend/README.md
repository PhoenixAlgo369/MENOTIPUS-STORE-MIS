# MENOTIPUS Store MIS - Flask Backend

A RESTful API backend for the MENOTIPUS Store Management Information System.

## Tech Stack

- **Framework**: Flask
- **ORM**: SQLAlchemy
- **Authentication**: JWT (Flask-JWT-Extended)
- **Validation**: Marshmallow
- **API**: Flask-RESTful
- **Database**: PostgreSQL
- **Migrations**: Flask-Migrate

## Prerequisites

- Python 3.10+
- PostgreSQL 12+
- pip (Python package manager)

## Installation

### 1. Set up PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE menotipus_store;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE menotipus_store TO postgres;
\q
```

### 2. Install Python dependencies

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 4. Initialize database

```bash
# Run database initialization
python init_db.py
```

### 5. Run the server

```bash
# Start Flask development server
python run.py
```

The API will be available at `http://localhost:5000`

## Default Credentials

After running `init_db.py`, you can login with:

| Role    | Username | Password     |
|---------|----------|--------------|
| Admin   | admin    | admin123     |
| Cashier | cashier  | cashier123   |

## API Endpoints

### Authentication

| Method | Endpoint              | Description           | Auth Required |
|--------|----------------------|-----------------------|---------------|
| POST   | `/api/auth/register`  | Register new user     | No            |
| POST   | `/api/auth/login`     | Login user            | No            |
| GET    | `/api/auth/profile`   | Get current user      | Yes           |

### Users

| Method | Endpoint              | Description           | Auth Required |
|--------|----------------------|-----------------------|---------------|
| GET    | `/api/users`          | List all users        | Yes           |
| GET    | `/api/users/<id>`     | Get user by ID        | Yes           |
| PUT    | `/api/users/<id>`     | Update user           | Yes           |
| DELETE | `/api/users/<id>`     | Delete user           | Yes           |
| POST   | `/api/users/<id>/pin` | Set user PIN          | Yes           |
| PUT    | `/api/users/<id>/pin` | Verify user PIN       | Yes           |

### Products

| Method | Endpoint                    | Description           | Auth Required |
|--------|----------------------------|-----------------------|---------------|
| GET    | `/api/products`            | List all products     | Yes           |
| POST   | `/api/products`            | Create product        | Yes           |
| GET    | `/api/products/<id>`       | Get product by ID     | Yes           |
| PUT    | `/api/products/<id>`       | Update product        | Yes           |
| DELETE | `/api/products/<id>`       | Delete product        | Yes           |
| PUT    | `/api/products/<id>/stock` | Update stock          | Yes           |
| POST   | `/api/products/<id>/stock` | Adjust stock          | Yes           |
| GET    | `/api/products/categories` | List categories       | Yes           |
| GET    | `/api/products/low-stock`  | Low stock products    | Yes           |

### Sales

| Method | Endpoint                  | Description           | Auth Required |
|--------|--------------------------|-----------------------|---------------|
| GET    | `/api/sales`             | List all sales        | Yes           |
| POST   | `/api/sales`             | Create sale           | Yes           |
| GET    | `/api/sales/<id>`        | Get sale by ID        | Yes           |
| DELETE | `/api/sales/<id>`        | Cancel sale           | Yes           |
| POST   | `/api/sales/<id>/refund` | Process refund        | Yes           |
| GET    | `/api/sales/today`       | Today's sales         | Yes           |
| GET    | `/api/sales/stats`       | Sales statistics      | Yes           |

### Stores

| Method | Endpoint              | Description           | Auth Required |
|--------|----------------------|-----------------------|---------------|
| GET    | `/api/stores`        | List all stores       | Yes           |
| POST   | `/api/stores`        | Create store          | Yes           |
| GET    | `/api/stores/<id>`   | Get store by ID       | Yes           |
| PUT    | `/api/stores/<id>`   | Update store          | Yes           |
| DELETE | `/api/stores/<id>`   | Delete store          | Yes           |

### Suppliers

| Method | Endpoint                  | Description           | Auth Required |
|--------|--------------------------|-----------------------|---------------|
| GET    | `/api/suppliers`         | List all suppliers    | Yes           |
| POST   | `/api/suppliers`         | Create supplier       | Yes           |
| GET    | `/api/suppliers/<id>`    | Get supplier by ID    | Yes           |
| PUT    | `/api/suppliers/<id>`    | Update supplier       | Yes           |
| DELETE | `/api/suppliers/<id>`    | Delete supplier       | Yes           |

### Dashboard

| Method | Endpoint            | Description           | Auth Required |
|--------|--------------------|-----------------------|---------------|
| GET    | `/api/dashboard`   | Dashboard stats       | Yes           |
| GET    | `/api/analytics`   | Analytics data        | Yes           |

## Usage Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Get Products (with auth token)

```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Product

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "New Product",
    "category": "Electronics",
    "selling_price": 99.99,
    "stock": 50,
    "min_stock": 10
  }'
```

### Create Sale

```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2, "unit_price": 24.99},
      {"product_id": 2, "quantity": 1, "unit_price": 9.99}
    ],
    "payment_method": "cash",
    "discount": 0
  }'
```

## Database Migrations

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # App factory
│   ├── config.py            # Configuration classes
│   ├── models/              # SQLAlchemy models
│   │   └── __init__.py
│   ├── schemas/             # Marshmallow schemas
│   │   └── __init__.py
│   ├── resources/           # Flask-RESTful resources
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── sales.py
│   │   ├── stores.py
│   │   └── dashboard.py
│   └── blueprints/          # Flask blueprints
│       └── __init__.py
├── venv/                    # Virtual environment
├── .env                     # Environment variables
├── .env.example             # Example environment file
├── requirements.txt         # Python dependencies
├── run.py                   # Main entry point
├── init_db.py              # Database initialization
└── README.md               # This file
```

## Environment Variables

| Variable                  | Description                    | Default                    |
|--------------------------|--------------------------------|----------------------------|
| `DATABASE_URL`           | PostgreSQL connection string   | postgresql://localhost/... |
| `SECRET_KEY`             | Flask secret key               | dev-secret-key             |
| `JWT_SECRET_KEY`         | JWT signing secret             | jwt-secret-key             |
| `JWT_ACCESS_TOKEN_EXPIRES`| Token expiry (seconds)        | 3600                       |
| `FLASK_ENV`              | Environment (dev/prod)         | development                |
| `FLASK_HOST`             | Server host                    | 0.0.0.0                    |
| `FLASK_PORT`             | Server port                    | 5000                       |

## License

MIT License
