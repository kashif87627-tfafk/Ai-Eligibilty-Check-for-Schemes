@echo off
echo ========================================
echo Starting Eligibility Platform Frontend
echo ========================================
echo.
cd packages\frontend
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting development server...
echo Frontend will open at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ========================================
call npm run dev
pause
