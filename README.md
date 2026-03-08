# MENOTIPUS Store MIS

A comprehensive Store Management Information System with a Flask RESTful API backend and React frontend.

## 🏗️ Project Structure

```
MENOTIPUS-STORE-MIS/
├── app/                          # Flask backend application
│   ├── __init__.py              # Application factory
│   ├── config.py                # Configuration classes
│   ├── models/                  # SQLAlchemy database models
│   ├── schemas/                 # Marshmallow validation schemas
│   ├── resources/               # Flask-RESTful API resources
│   └── blueprints/              # Flask blueprints
├── clients/web/                  # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── tests/                        # Test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── scripts/                      # Utility scripts
├── docker/                       # Docker configuration
├── docs/                         # Documentation
└── .github/workflows/           # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set up database
sudo -u postgres psql -c "CREATE DATABASE menotipus_store;"

# Initialize database
python init_db.py

# Run server
python run.py
```

### Frontend Setup

```bash
cd clients/web

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test type
pytest tests/unit/
pytest tests/integration/
```

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📦 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get current user profile

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/<id>` - Get user
- `PUT /api/v1/users/<id>` - Update user
- `DELETE /api/v1/users/<id>` - Delete user

### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/<id>` - Get product
- `PUT /api/v1/products/<id>` - Update product
- `DELETE /api/v1/products/<id>` - Delete product

### Sales
- `GET /api/v1/sales` - List sales
- `POST /api/v1/sales` - Create sale
- `GET /api/v1/sales/<id>` - Get sale
- `DELETE /api/v1/sales/<id>` - Cancel sale

### Dashboard
- `GET /api/v1/dashboard` - Dashboard statistics
- `GET /api/v1/analytics` - Analytics data

## 🔐 Default Credentials

After running `init_db.py`:

| Role    | Username | Password     |
|---------|----------|--------------|
| Admin   | admin    | admin123     |
| Cashier | cashier  | cashier123   |

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 3.0
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL
- **Authentication**: JWT (Flask-JWT-Extended)
- **Validation**: Marshmallow
- **API**: Flask-RESTful
- **Testing**: pytest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: React Context
- **HTTP**: Fetch API

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@menotipus.com
