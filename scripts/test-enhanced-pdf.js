#!/usr/bin/env node

/**
 * 增强PDF处理测试脚本
 * 直接测试PDF文件的完整内容提取
 */

const fs = require('fs');
const path = require('path');

// 动态导入ES模块
async function testEnhancedPDF() {
  try {
    console.log('🔍 增强PDF处理测试开始...\n');

    // 目标PDF文件
    const pdfFilePath = 'E:\\trae\\0814合同\\舶源-金港【金港模板】（上牌）.pdf';
    
    // 检查文件是否存在
    if (!fs.existsSync(pdfFilePath)) {
      console.log('❌ PDF文件不存在:', pdfFilePath);
      return;
    }

    const stats = fs.statSync(pdfFilePath);
    console.log('📄 PDF文件信息:');
    console.log(`   路径: ${pdfFilePath}`);
    console.log(`   大小: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`   修改时间: ${stats.mtime.toLocaleString()}\n`);

    // 导入增强PDF处理器
    const { enhancedPDFProcessor } = await import('../src/lib/enhanced-pdf-processor.js');
    
    console.log('🚀 开始处理PDF文件...');
    const result = await enhancedPDFProcessor.processFile(pdfFilePath);

    if (!result.success) {
      console.log('❌ PDF处理失败:', result.error);
      return;
    }

    console.log('✅ PDF处理成功!\n');

    // 显示处理结果
    console.log('📊 处理结果统计:');
    console.log(`   页面数量: ${result.metadata.pageCount}`);
    console.log(`   字数统计: ${result.metadata.wordCount}`);
    console.log(`   包含变量: ${result.metadata.hasVariables ? '是' : '否'}`);
    console.log(`   原始文本长度: ${result.fullText.length}`);
    console.log(`   结构化文本长度: ${result.structuredContent.length}`);
    console.log(`   识别变量数量: ${result.variables.length}\n`);

    // 显示识别的变量
    if (result.variables.length > 0) {
      console.log('🔍 识别的变量占位符:');
      result.variables.forEach((variable, index) => {
        console.log(`   ${index + 1}. ${variable.placeholder} (位置: ${variable.position})`);
        console.log(`      上下文: ...${variable.context.substring(0, 100)}...`);
      });
      console.log('');
    }

    // 显示原始文本预览
    console.log('📝 原始文本内容预览 (前1000字符):');
    console.log('=' + '='.repeat(60));
    console.log(result.fullText.substring(0, 1000));
    if (result.fullText.length > 1000) {
      console.log('\n... (还有 ' + (result.fullText.length - 1000) + ' 个字符)');
    }
    console.log('=' + '='.repeat(60) + '\n');

    // 显示结构化内容预览
    console.log('🏗️ 结构化内容预览 (前1000字符):');
    console.log('-' + '-'.repeat(60));
    console.log(result.structuredContent.substring(0, 1000));
    if (result.structuredContent.length > 1000) {
      console.log('\n... (还有 ' + (result.structuredContent.length - 1000) + ' 个字符)');
    }
    console.log('-' + '-'.repeat(60) + '\n');

    // 测试变量替换
    console.log('🔄 测试变量替换...');
    const testVariables = {
      '甲方名称': '广州南沙开发区管理委员会',
      '乙方名称': '比亚迪汽车销售有限公司',
      '合同金额': '280000',
      '签订日期': '2025年1月18日',
      '签订地点': '广州市南沙区'
    };

    const replacedContent = enhancedPDFProcessor.replaceVariables(
      result.structuredContent,
      testVariables
    );

    console.log('✅ 变量替换完成');
    console.log(`   替换前长度: ${result.structuredContent.length}`);
    console.log(`   替换后长度: ${replacedContent.length}`);
    console.log(`   内容变化: ${replacedContent !== result.structuredContent ? '是' : '否'}\n`);

    // 显示替换后的内容预览
    console.log('🎯 变量替换后内容预览 (前1000字符):');
    console.log('*' + '*'.repeat(60));
    console.log(replacedContent.substring(0, 1000));
    if (replacedContent.length > 1000) {
      console.log('\n... (还有 ' + (replacedContent.length - 1000) + ' 个字符)');
    }
    console.log('*' + '*'.repeat(60) + '\n');

    // 保存处理结果到文件
    const outputDir = './temp';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 保存原始文本
    fs.writeFileSync(path.join(outputDir, 'pdf-raw-text.txt'), result.fullText, 'utf8');
    
    // 保存结构化内容
    fs.writeFileSync(path.join(outputDir, 'pdf-structured.txt'), result.structuredContent, 'utf8');
    
    // 保存替换后内容
    fs.writeFileSync(path.join(outputDir, 'pdf-replaced.txt'), replacedContent, 'utf8');
    
    // 保存变量信息
    const variableInfo = {
      variables: result.variables,
      testVariables,
      metadata: result.metadata
    };
    fs.writeFileSync(path.join(outputDir, 'pdf-variables.json'), JSON.stringify(variableInfo, null, 2), 'utf8');

    console.log('💾 处理结果已保存到文件:');
    console.log(`   原始文本: ${path.join(outputDir, 'pdf-raw-text.txt')}`);
    console.log(`   结构化内容: ${path.join(outputDir, 'pdf-structured.txt')}`);
    console.log(`   替换后内容: ${path.join(outputDir, 'pdf-replaced.txt')}`);
    console.log(`   变量信息: ${path.join(outputDir, 'pdf-variables.json')}\n`);

    // 分析内容质量
    console.log('📈 内容质量分析:');
    const originalLines = result.fullText.split('\n').filter(line => line.trim().length > 0);
    const structuredLines = result.structuredContent.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`   原始行数: ${originalLines.length}`);
    console.log(`   结构化行数: ${structuredLines.length}`);
    console.log(`   内容保留率: ${((structuredLines.length / originalLines.length) * 100).toFixed(1)}%`);
    
    // 检查是否包含关键合同内容
    const hasContractKeywords = [
      '甲方', '乙方', '合同', '协议', '条款', '责任', '义务', '权利', '违约', '争议'
    ].some(keyword => result.structuredContent.includes(keyword));
    
    console.log(`   包含合同关键词: ${hasContractKeywords ? '是' : '否'}`);
    
    if (result.structuredContent.length < 500) {
      console.log('⚠️  警告: 提取的内容过短，可能存在问题');
    } else if (result.structuredContent.length > 10000) {
      console.log('✅ 内容丰富，提取效果良好');
    } else {
      console.log('✅ 内容适中，提取效果正常');
    }

    console.log('\n🎉 增强PDF处理测试完成!');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error.stack);
  }
}

// 运行测试
testEnhancedPDF();
