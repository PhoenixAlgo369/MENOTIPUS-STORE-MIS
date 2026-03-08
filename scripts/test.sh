#!/bin/bash
# ===========================================
# MENOTIPUS STORE MIS - Run Tests Script
# ===========================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     MENOTIPUS STORE MIS - Test Runner                    ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Run setup.sh first."
    exit 1
fi

# Install test dependencies
pip install -r requirements-test.txt > /dev/null 2>&1

# Run tests based on argument
case "${1:-all}" in
    unit)
        echo "Running unit tests..."
        pytest tests/unit/ -v --cov=app --cov-report=term-missing
        ;;
    integration)
        echo "Running integration tests..."
        pytest tests/integration/ -v --cov=app --cov-report=term-missing
        ;;
    coverage)
        echo "Running tests with coverage report..."
        pytest --cov=app --cov-report=html --cov-report=term-missing
        echo "Coverage report generated at htmlcov/index.html"
        ;;
    watch)
        echo "Running tests in watch mode..."
        pip install pytest-watch > /dev/null 2>&1
        ptw -- --cov=app
        ;;
    all|*)
        echo "Running all tests..."
        pytest -v --cov=app --cov-report=term-missing --cov-report=html
        echo ""
        echo "Coverage report: htmlcov/index.html"
        ;;
esac

echo ""
echo "Tests completed successfully!"
