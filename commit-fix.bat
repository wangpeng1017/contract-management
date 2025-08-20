@echo off
echo Committing TypeScript type safety fixes...
echo.

git add .

git commit -m "fix: resolve TypeScript type safety error - fix undefined object access

Core fixes:
- Fixed undefined object access in generateTestSummary function
- Resolved Object is possibly undefined error in scores.reduce operation
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
- Complete type safety assurance"

git push origin master

echo.
echo Commit completed successfully!
echo.
git log --oneline -1
echo.
pause
