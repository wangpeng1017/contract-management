@echo off
echo 正在上传代码到GitHub...
echo.
echo 请确保您已经在GitHub上创建了仓库
echo 仓库名称建议: intelligent-contract-management
echo.
set /p GITHUB_USERNAME=请输入您的GitHub用户名: 
set /p REPO_NAME=请输入仓库名称: 

echo.
echo 正在添加远程仓库...
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

echo.
echo 正在推送代码到GitHub...
git branch -M main
git push -u origin main

echo.
echo 上传完成！
echo 您的仓库地址: https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
pause
