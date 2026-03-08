#!/bin/bash
# ===========================================
# MENOTIPUS STORE MIS - Setup Script
# ===========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     MENOTIPUS STORE MIS - Setup Script                   ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Check prerequisites
log_info "Checking prerequisites..."
check_command python3
check_command pip3
check_command node
check_command npm

# Setup Python virtual environment
log_info "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    log_info "Virtual environment created."
else
    log_warn "Virtual environment already exists."
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
log_info "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-test.txt

# Setup environment file
if [ ! -f ".env" ]; then
    log_info "Creating .env file from .env.example..."
    cp .env.example .env
    log_warn "Please update .env with your configuration."
else
    log_warn ".env file already exists."
fi

# Setup PostgreSQL
log_info "Setting up PostgreSQL database..."
read -p "Create database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo -u postgres psql -c "CREATE DATABASE menotipus_store;" 2>/dev/null || log_warn "Database may already exist."
    sudo -u postgres psql -c "CREATE DATABASE menotipus_store_test;" 2>/dev/null || log_warn "Test database may already exist."
    log_info "Databases created."
fi

# Initialize database
read -p "Initialize database with seed data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Initializing database..."
    python init_db.py
fi

# Setup frontend
log_info "Setting up frontend..."
cd clients/web
if [ ! -d "node_modules" ]; then
    npm install
    log_info "Frontend dependencies installed."
else
    log_warn "Frontend dependencies already installed."
fi
cd ..

# Install pre-commit hooks
log_info "Setting up pre-commit hooks..."
pip install pre-commit
pre-commit install

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Setup Complete!                             ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Next steps:                                             ║"
echo "║  1. Update .env with your configuration                  ║"
echo "║  2. Run backend: python run.py                           ║"
echo "║  3. Run frontend: cd clients/web && npm run dev          ║"
echo "║  4. Access API: http://localhost:5000                    ║"
echo "║  5. Access Web: http://localhost:5173                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
