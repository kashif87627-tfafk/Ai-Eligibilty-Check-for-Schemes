# Add Bedrock and Marketplace Permissions
# This script adds the required permissions to your IAM user

Write-Host "🔧 Adding Bedrock and Marketplace Permissions..." -ForegroundColor Cyan
Write-Host ""

# Get current user identity
Write-Host "📋 Getting your AWS identity..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $arn = $identity.Arn
    
    # Extract username from ARN
    if ($arn -match "user/(.+)$") {
        $username = $Matches[1]
        Write-Host "✅ Found user: $username" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not extract username from ARN: $arn" -ForegroundColor Red
        Write-Host "   You might be using a role instead of a user." -ForegroundColor Yellow
        Write-Host "   Please add permissions manually via IAM Console." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get AWS identity" -ForegroundColor Red
    Write-Host "   Make sure AWS CLI is configured: aws configure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔐 Adding permissions..." -ForegroundColor Yellow

# Add Marketplace permissions
Write-Host "   → Adding AWS Marketplace permissions..." -ForegroundColor Cyan
try {
    aws iam attach-user-policy `
        --user-name $username `
        --policy-arn "arn:aws:iam::aws:policy/AWSMarketplaceManageSubscriptions" 2>&1 | Out-Null
    Write-Host "   ✅ Marketplace permissions added" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not add Marketplace permissions" -ForegroundColor Yellow
    Write-Host "      Error: $_" -ForegroundColor Red
}

# Add Bedrock permissions
Write-Host "   → Adding Bedrock permissions..." -ForegroundColor Cyan
try {
    aws iam attach-user-policy `
        --user-name $username `
        --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess" 2>&1 | Out-Null
    Write-Host "   ✅ Bedrock permissions added" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not add Bedrock permissions" -ForegroundColor Yellow
    Write-Host "      Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "⏳ Waiting 30 seconds for permissions to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "🧪 Testing Bedrock access..." -ForegroundColor Cyan
node enable-bedrock.js

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. If the test succeeded, refresh your browser" -ForegroundColor White
Write-Host "   2. Go to 'Discover Schemes' tab" -ForegroundColor White
Write-Host "   3. Search for schemes!" -ForegroundColor White
Write-Host ""
