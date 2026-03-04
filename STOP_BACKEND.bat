@echo off
echo ========================================
echo Destroying AWS Backend Resources
echo ========================================
echo.
echo WARNING: This will DELETE all AWS resources!
echo - All data will be lost
echo - Users will be deleted
echo - Documents will be deleted
echo.
echo Press Ctrl+C to cancel, or
pause
echo.
cd packages\infrastructure
echo.
echo Destroying AWS resources...
call npx cdk destroy --all
echo.
echo ========================================
echo AWS resources destroyed!
echo ========================================
echo.
echo To restart, run START_BACKEND.bat
echo.
pause
