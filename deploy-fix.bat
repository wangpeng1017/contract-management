@echo off
echo Force redeploying contract generation improvements...

git add .
git commit -m "fix: force redeploy with contract generation improvements - database test API and detailed error handling"
git push origin master

echo.
echo Deployment triggered successfully!
echo Please wait for Vercel to complete the deployment.
pause
