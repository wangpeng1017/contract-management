@echo off
chcp 65001 >nul
echo Starting git operations...

git add .
if %errorlevel% neq 0 (
    echo Error: git add failed
    pause
    exit /b 1
)

git commit -m "fix: resolve TypeScript type safety error - fix undefined object access in generateTestSummary function"
if %errorlevel% neq 0 (
    echo Error: git commit failed
    pause
    exit /b 1
)

git push origin master
if %errorlevel% neq 0 (
    echo Error: git push failed
    pause
    exit /b 1
)

echo.
echo Success! Showing latest commit:
git log --oneline -1

echo.
echo All git operations completed successfully!
pause
