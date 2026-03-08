# Development Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 12+
- Git

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/PhoenixAlgo369/MENOTIPUS-STORE-MIS.git
cd MENOTIPUS-STORE-MIS
```

### 2. Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-test.txt

# Copy environment file
cp .env.example .env

# Set up database
sudo -u postgres psql
CREATE DATABASE menotipus_store;
CREATE DATABASE menotipus_store_test;
\q

# Initialize database
python init_db.py

# Run server
python run.py
```

### 3. Frontend Setup

```bash
cd clients/web

# Install dependencies
npm install

# Run development server
npm run dev
```

## Code Style

### Python

We use Black, isort, and flake8 for code formatting and linting.

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Manual formatting
black app tests
isort app tests
flake8 app tests
```

### JavaScript/TypeScript

```bash
cd clients/web

# Lint
npm run lint

# Format
npm run format
```

## Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/unit/test_models.py

# Specific test
pytest tests/unit/test_models.py::TestUserModel::test_create_user

# Integration tests
pytest tests/integration/
```

## Database Migrations

```bash
# Create migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback
flask db downgrade -1
```

## API Testing

### Using curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get products (with token)
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using httpie (recommended)

```bash
# Install
pip install httpie

# Login
http POST :5000/api/auth/login username=admin password=admin123

# Get products
http GET :5000/api/products Authorization:"Bearer YOUR_TOKEN"
```

## Debugging

### Flask Debug Mode

Set in `.env`:
```
FLASK_DEBUG=True
```

### Python Debugger

```python
import pdb; pdb.set_trace()
```

Or use Python 3.7+:
```python
breakpoint()
```

### VS Code Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flask Backend",
      "type": "python",
      "request": "launch",
      "module": "flask",
      "env": {
        "FLASK_APP": "run.py",
        "FLASK_DEBUG": "1"
      },
      "args": ["run"],
      "jinja": true
    }
  ]
}
```

## Docker Development

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run tests in container
docker-compose exec backend pytest

# Stop services
docker-compose down
```

## Common Issues

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### npm install fails

```bash
# Clear cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/feature-name
```

### Commit Message Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/config changes

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.
