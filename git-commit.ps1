# PowerShell script to commit and push changes
Write-Host "Starting git operations..." -ForegroundColor Green

try {
    # Stage all changes
    Write-Host "Staging all changes..." -ForegroundColor Yellow
    git add .
    if ($LASTEXITCODE -ne 0) {
        throw "git add failed with exit code $LASTEXITCODE"
    }
    Write-Host "✓ Files staged successfully" -ForegroundColor Green

    # Create commit
    Write-Host "Creating commit..." -ForegroundColor Yellow
    $commitMessage = @"
fix: force redeploy with contract generation improvements

Core improvements deployed:
- Enhanced error handling in contract generation API with detailed error messages
- Added database connection test API at /api/test/database
- Improved template storage system with better fallback mechanisms
- Added comprehensive logging for debugging production issues

Specific changes:
- src/app/api/contracts/generate/route.ts - detailed error handling and logging
- src/app/api/test/database/route.ts - new database connection test endpoint
- src/lib/template-storage.ts - improved traditional content generation
- Enhanced error messages for better production debugging

Deployment verification:
- Database test API should be accessible at /api/test/database
- Contract generation API should return detailed error messages
- All previous TypeScript and build issues resolved
- Ready for production testing and validation
"@

    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "git commit failed with exit code $LASTEXITCODE"
    }
    Write-Host "✓ Commit created successfully" -ForegroundColor Green

    # Push to remote
    Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
    git push origin master
    if ($LASTEXITCODE -ne 0) {
        throw "git push failed with exit code $LASTEXITCODE"
    }
    Write-Host "✓ Push completed successfully" -ForegroundColor Green

    # Show latest commit
    Write-Host "`nLatest commit:" -ForegroundColor Cyan
    git log --oneline -1

    Write-Host "`n🎉 All git operations completed successfully!" -ForegroundColor Green
    Write-Host "Vercel deployment should be triggered automatically." -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
