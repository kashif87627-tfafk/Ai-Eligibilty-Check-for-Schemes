@echo off
echo ========================================
echo Starting Backend Deployment
echo ========================================
echo.
echo Step 1: Building TypeScript code...
cd packages\backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)
echo.
echo Step 2: Bundling Lambda functions...
call npm run bundle-lambda
if %errorlevel% neq 0 (
    echo ERROR: Lambda bundling failed!
    pause
    exit /b %errorlevel%
)
echo.
echo Step 3: Deploying to AWS...
cd ..\infrastructure
call npx cdk deploy --all --require-approval never
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    pause
    exit /b %errorlevel%
)
echo.
echo ========================================
echo Backend Deployment Complete!
echo ========================================
echo.
echo Fetching deployment outputs...
echo.
aws cloudformation describe-stacks --stack-name EligibilityMvpStack --query "Stacks[0].Outputs" --output table
echo.
echo ========================================
echo Backend is now running on AWS Lambda
echo ========================================
pause
