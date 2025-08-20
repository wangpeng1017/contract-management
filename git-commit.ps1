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
fix: resolve TypeScript type safety error - fix undefined object access

Core fixes:
- Fixed undefined object access in generateTestSummary function
- Resolved 'Object is possibly undefined' error in scores.reduce operation
- Improved score processing logic to ensure only valid number values are processed
- Enhanced type safety by replacing unsafe filter+map+reduce chain with explicit loop and type checking

Specific changes:
- src/app/api/test/feishu-e2e/route.ts (line 263)
- Replaced unsafe chained operations with explicit type-safe loop
- Added typeof checks to ensure value type correctness
- Created explicit number array to avoid type inference issues

Expected results:
- Vercel build passes TypeScript compilation phase
- Test summary generation function is stable and reliable
- End-to-end testing system fully functional
- Complete type safety assurance
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
