#!/usr/bin/env node

/**
 * Vercel 部署验证脚本
 * 验证代码是否准备好部署到 Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始 Vercel 部署验证...\n');

// 验证步骤
const verificationSteps = [
  {
    name: 'TypeScript 类型检查',
    command: 'npx tsc --noEmit',
    description: '检查 TypeScript 类型错误'
  },
  {
    name: 'ESLint 代码检查',
    command: 'npm run lint',
    description: '检查代码规范和潜在错误'
  },
  {
    name: 'Next.js 构建测试',
    command: 'npm run build',
    description: '验证生产构建是否成功'
  }
];

let allPassed = true;
const results = [];

for (const step of verificationSteps) {
  console.log(`📋 ${step.name}...`);
  console.log(`   ${step.description}`);
  
  try {
    const startTime = Date.now();
    const output = execSync(step.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${step.name} 通过 (${duration}ms)`);
    results.push({
      step: step.name,
      status: 'PASS',
      duration,
      output: output.slice(0, 200) + (output.length > 200 ? '...' : '')
    });
    
  } catch (error) {
    console.log(`❌ ${step.name} 失败`);
    console.log(`   错误: ${error.message}`);
    
    allPassed = false;
    results.push({
      step: step.name,
      status: 'FAIL',
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
  }
  
  console.log('');
}

// 检查关键文件
console.log('📁 检查关键文件...');
const criticalFiles = [
  'package.json',
  'next.config.js',
  'prisma/schema.prisma',
  '.env.example',
  'src/lib/database.ts'
];

for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`❌ ${file} 缺失`);
    allPassed = false;
  }
}

// 检查环境变量
console.log('\n🔧 检查环境变量配置...');
const envExample = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = envContent.match(/^[A-Z_]+=.*/gm) || [];
  console.log(`✅ 找到 ${requiredVars.length} 个环境变量配置`);
  
  // 检查是否有本地 .env 文件
  const localEnv = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) {
    console.log('✅ .env.local 文件存在');
  } else {
    console.log('⚠️  .env.local 文件不存在（部署时需要配置环境变量）');
  }
} else {
  console.log('❌ .env.example 文件缺失');
  allPassed = false;
}

// 检查依赖
console.log('\n📦 检查依赖配置...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = [
  'next',
  'react',
  'prisma',
  '@prisma/client',
  'mammoth',
  'turndown',
  'markdown-it',
  'docx'
];

for (const dep of criticalDeps) {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep} 已安装`);
  } else {
    console.log(`❌ ${dep} 缺失`);
    allPassed = false;
  }
}

// 生成报告
console.log('\n📊 验证报告:');
console.log('='.repeat(50));

results.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.step}: ${result.status}`);
  if (result.duration) {
    console.log(`   耗时: ${result.duration}ms`);
  }
  if (result.error) {
    console.log(`   错误: ${result.error.slice(0, 100)}...`);
  }
});

console.log('='.repeat(50));

if (allPassed) {
  console.log('🎉 所有验证通过！代码已准备好部署到 Vercel');
  console.log('\n📋 部署清单:');
  console.log('   ✅ TypeScript 类型检查通过');
  console.log('   ✅ ESLint 代码检查通过');
  console.log('   ✅ Next.js 构建成功');
  console.log('   ✅ 关键文件完整');
  console.log('   ✅ 依赖配置正确');
  
  console.log('\n🚀 下一步:');
  console.log('   1. 推送代码到 GitHub');
  console.log('   2. 在 Vercel 中配置环境变量');
  console.log('   3. 触发部署');
  
  process.exit(0);
} else {
  console.log('❌ 验证失败！请修复上述问题后重试');
  console.log('\n🔧 建议修复步骤:');
  console.log('   1. 检查并修复 TypeScript 错误');
  console.log('   2. 解决 ESLint 规则违反');
  console.log('   3. 确保所有依赖正确安装');
  console.log('   4. 验证环境变量配置');
  
  process.exit(1);
}
