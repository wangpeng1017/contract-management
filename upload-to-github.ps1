# 智能合同管理系统 - GitHub上传脚本

Write-Host "🚀 智能合同管理系统 - GitHub上传工具" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# 检查Git状态
Write-Host "📋 检查Git状态..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  发现未提交的更改，正在提交..." -ForegroundColor Yellow
    git add .
    git commit -m "chore: 准备上传到GitHub"
}

Write-Host "✅ Git状态检查完成" -ForegroundColor Green
Write-Host ""

# 获取用户输入
Write-Host "请提供GitHub仓库信息:" -ForegroundColor Cyan
$githubUsername = Read-Host "GitHub用户名"
$repoName = Read-Host "仓库名称 (建议: intelligent-contract-management)"

if (-not $githubUsername -or -not $repoName) {
    Write-Host "❌ 用户名和仓库名称不能为空" -ForegroundColor Red
    exit 1
}

# 构建仓库URL
$repoUrl = "https://github.com/$githubUsername/$repoName.git"

Write-Host ""
Write-Host "📡 正在连接到GitHub仓库..." -ForegroundColor Yellow
Write-Host "仓库地址: $repoUrl" -ForegroundColor Gray

# 检查是否已有远程仓库
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "⚠️  检测到已存在的远程仓库: $existingRemote" -ForegroundColor Yellow
    $overwrite = Read-Host "是否要覆盖? (y/N)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        git remote remove origin
        Write-Host "✅ 已移除旧的远程仓库" -ForegroundColor Green
    } else {
        Write-Host "❌ 操作已取消" -ForegroundColor Red
        exit 1
    }
}

# 添加远程仓库
try {
    git remote add origin $repoUrl
    Write-Host "✅ 远程仓库添加成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 添加远程仓库失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 正在推送代码到GitHub..." -ForegroundColor Yellow

# 推送代码
try {
    git branch -M main
    git push -u origin main
    
    Write-Host ""
    Write-Host "🎉 代码上传成功!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "📍 仓库地址: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
    Write-Host "🌐 在线查看: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 下一步操作:" -ForegroundColor Yellow
    Write-Host "1. 在Vercel中导入GitHub仓库" -ForegroundColor White
    Write-Host "2. 配置环境变量" -ForegroundColor White
    Write-Host "3. 部署到生产环境" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ 推送失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的解决方案:" -ForegroundColor Yellow
    Write-Host "1. 确保GitHub仓库已创建且为空" -ForegroundColor White
    Write-Host "2. 检查GitHub用户名和仓库名称是否正确" -ForegroundColor White
    Write-Host "3. 确保您有推送权限" -ForegroundColor White
    exit 1
}

Write-Host "按任意键继续..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
