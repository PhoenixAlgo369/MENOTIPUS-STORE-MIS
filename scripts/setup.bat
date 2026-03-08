@echo off
REM ===========================================
REM MENOTIPUS STORE MIS - Setup Script (Windows)
REM ===========================================

echo ╔══════════════════════════════════════════════════════════╗
echo ║     MENOTIPUS STORE MIS - Setup Script                   ║
echo ╚══════════════════════════════════════════════════════════╝

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.10+
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

REM Setup Python virtual environment
echo [INFO] Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [INFO] Virtual environment created.
) else (
    echo [WARN] Virtual environment already exists.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
echo [INFO] Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-test.txt

REM Setup environment file
if not exist ".env" (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo [WARN] Please update .env with your configuration.
) else (
    echo [WARN] .env file already exists.
)

REM Initialize database
echo [INFO] Initializing database...
python init_db.py

REM Setup frontend
echo [INFO] Setting up frontend...
cd clients\web
if not exist "node_modules" (
    call npm install
    echo [INFO] Frontend dependencies installed.
) else (
    echo [WARN] Frontend dependencies already installed.
)
cd ..

REM Install pre-commit hooks
echo [INFO] Setting up pre-commit hooks...
pip install pre-commit
pre-commit install

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              Setup Complete!                             ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Next steps:                                             ║
echo ║  1. Update .env with your configuration                  ║
echo ║  2. Run backend: python run.py                           ║
echo ║  3. Run frontend: cd clients\web ^&^& npm run dev          ║
echo ║  4. Access API: http://localhost:5000                    ║
echo ║  5. Access Web: http://localhost:5173                    ║
echo ╚══════════════════════════════════════════════════════════╝

pause
