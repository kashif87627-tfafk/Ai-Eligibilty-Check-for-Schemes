@echo off
echo ========================================
echo Testing Profile API
echo ========================================
echo.
echo This will test if the Lambda function can now access the uuid module.
echo.
echo Please try creating a profile in your frontend application now.
echo The error "Cannot find module 'uuid'" should be fixed.
echo.
echo If you see HTTP 502 errors, check the Lambda logs with:
echo aws logs tail /aws/lambda/eligibility-mvp-profile --follow
echo.
pause
