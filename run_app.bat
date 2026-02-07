@echo off
echo ==========================================
echo   AI Study Planner for Engineering Students
echo ==========================================
echo.
echo [1/2] Checking dependencies...
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies. Check your internet connection.
    pause
    exit /b
)

echo.
echo [2/2] Starting Server...
echo Opening browser to: http://localhost:8000
timeout /t 2 >nul
start http://localhost:8000
echo (Press Ctrl+C to stop)
echo.
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server crashed. See error above.
    pause
)
