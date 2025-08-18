#!/usr/bin/env node

/**
 * 直接PDF测试脚本
 * 使用pdf-parse直接测试PDF内容提取
 */

const fs = require('fs');
const pdf = require('pdf-parse');

async function testDirectPDF() {
  try {
    console.log('🔍 直接PDF内容提取测试开始...\n');

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

    // 读取PDF文件
    console.log('📖 读取PDF文件...');
    const dataBuffer = fs.readFileSync(pdfFilePath);
    
    // 使用pdf-parse提取文本
    console.log('🔍 提取PDF文本内容...');
    const pdfData = await pdf(dataBuffer, {
      normalizeWhitespace: false,
      pagerender: undefined,
      max: 0
    });

    console.log('✅ PDF解析完成!\n');

    // 显示基本信息
    console.log('📊 PDF基本信息:');
    console.log(`   页面数量: ${pdfData.numpages}`);
    console.log(`   文本长度: ${pdfData.text.length} 字符`);
    console.log(`   字数统计: ${pdfData.text.split(/\s+/).length} 词`);
    
    if (pdfData.info) {
      console.log('   元数据:');
      console.log(`     标题: ${pdfData.info.Title || '未知'}`);
      console.log(`     作者: ${pdfData.info.Author || '未知'}`);
      console.log(`     创建者: ${pdfData.info.Creator || '未知'}`);
      console.log(`     制作者: ${pdfData.info.Producer || '未知'}`);
    }
    console.log('');

    // 显示完整文本内容
    console.log('📝 完整PDF文本内容:');
    console.log('=' + '='.repeat(80));
    console.log(pdfData.text);
    console.log('=' + '='.repeat(80) + '\n');

    // 分析文本结构
    const lines = pdfData.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('📐 文本结构分析:');
    console.log(`   总行数: ${lines.length}`);
    console.log(`   非空行数: ${lines.length}`);
    console.log(`   平均行长度: ${(pdfData.text.length / lines.length).toFixed(1)} 字符\n`);

    // 显示前20行内容
    console.log('📋 前20行内容:');
    console.log('-' + '-'.repeat(60));
    lines.slice(0, 20).forEach((line, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}: ${line}`);
    });
    if (lines.length > 20) {
      console.log(`... (还有 ${lines.length - 20} 行)`);
    }
    console.log('-' + '-'.repeat(60) + '\n');

    // 查找可能的变量占位符
    console.log('🔍 查找变量占位符...');
    const variablePatterns = [
      /\[([^\]]+)\]/g,        // [变量名]
      /\{\{([^}]+)\}\}/g,     // {{变量名}}
      /\$\{([^}]+)\}/g,       // ${变量名}
      /【([^】]+)】/g,        // 【变量名】
      /\[([^[\]]*[甲乙丙丁][^[\]]*)\]/g,  // 包含甲乙丙丁的占位符
      /\[([^[\]]*[名称|金额|日期|地点|时间][^[\]]*)\]/g  // 包含关键词的占位符
    ];

    const foundVariables = [];
    for (const pattern of variablePatterns) {
      let match;
      while ((match = pattern.exec(pdfData.text)) !== null) {
        const placeholder = match[0];
        const position = match.index;
        
        // 获取上下文
        const start = Math.max(0, position - 30);
        const end = Math.min(pdfData.text.length, position + placeholder.length + 30);
        const context = pdfData.text.substring(start, end);
        
        foundVariables.push({
          placeholder,
          position,
          context
        });
      }
    }

    if (foundVariables.length > 0) {
      console.log(`✅ 找到 ${foundVariables.length} 个可能的变量占位符:`);
      foundVariables.forEach((variable, index) => {
        console.log(`   ${index + 1}. ${variable.placeholder} (位置: ${variable.position})`);
        console.log(`      上下文: ...${variable.context}...`);
      });
    } else {
      console.log('⚠️  未找到明显的变量占位符');
      
      // 查找可能的变量位置（包含关键词的行）
      console.log('\n🔍 查找包含关键词的行:');
      const keywords = ['甲方', '乙方', '金额', '日期', '地点', '名称', '合同'];
      const keywordLines = [];
      
      lines.forEach((line, index) => {
        for (const keyword of keywords) {
          if (line.includes(keyword)) {
            keywordLines.push({
              lineNumber: index + 1,
              content: line,
              keyword
            });
            break;
          }
        }
      });
      
      if (keywordLines.length > 0) {
        console.log(`   找到 ${keywordLines.length} 行包含关键词:`);
        keywordLines.slice(0, 10).forEach(item => {
          console.log(`     第${item.lineNumber}行 (${item.keyword}): ${item.content}`);
        });
        if (keywordLines.length > 10) {
          console.log(`     ... (还有 ${keywordLines.length - 10} 行)`);
        }
      }
    }
    console.log('');

    // 保存结果到文件
    const outputDir = './temp';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 保存完整文本
    fs.writeFileSync(`${outputDir}/pdf-full-text.txt`, pdfData.text, 'utf8');
    
    // 保存行分析
    const lineAnalysis = lines.map((line, index) => `${index + 1}: ${line}`).join('\n');
    fs.writeFileSync(`${outputDir}/pdf-lines.txt`, lineAnalysis, 'utf8');
    
    // 保存变量分析
    const analysis = {
      basicInfo: {
        pages: pdfData.numpages,
        textLength: pdfData.text.length,
        wordCount: pdfData.text.split(/\s+/).length,
        lineCount: lines.length
      },
      metadata: pdfData.info,
      variables: foundVariables,
      sampleLines: lines.slice(0, 50)
    };
    fs.writeFileSync(`${outputDir}/pdf-analysis.json`, JSON.stringify(analysis, null, 2), 'utf8');

    console.log('💾 分析结果已保存:');
    console.log(`   完整文本: ${outputDir}/pdf-full-text.txt`);
    console.log(`   行分析: ${outputDir}/pdf-lines.txt`);
    console.log(`   详细分析: ${outputDir}/pdf-analysis.json\n`);

    // 内容质量评估
    console.log('📈 内容质量评估:');
    
    if (pdfData.text.length < 100) {
      console.log('❌ 严重问题: 提取的文本过短，可能PDF解析失败');
    } else if (pdfData.text.length < 1000) {
      console.log('⚠️  警告: 提取的文本较短，可能存在问题');
    } else {
      console.log('✅ 文本长度正常');
    }

    const hasChineseContent = /[\u4e00-\u9fa5]/.test(pdfData.text);
    console.log(`   包含中文内容: ${hasChineseContent ? '是' : '否'}`);
    
    const hasContractKeywords = ['甲方', '乙方', '合同', '协议'].some(keyword => pdfData.text.includes(keyword));
    console.log(`   包含合同关键词: ${hasContractKeywords ? '是' : '否'}`);
    
    const hasStructure = lines.some(line => 
      line.match(/第[一二三四五六七八九十\d]+条/) || 
      line.match(/^\d+[、．.]/) ||
      line.includes('条款')
    );
    console.log(`   包含结构化内容: ${hasStructure ? '是' : '否'}`);

    console.log('\n🎉 直接PDF测试完成!');
    
    if (pdfData.text.length > 1000 && hasChineseContent && hasContractKeywords) {
      console.log('✅ PDF内容提取成功，可以进行下一步处理');
    } else {
      console.log('⚠️  PDF内容提取可能存在问题，需要进一步分析');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error.stack);
  }
}

// 运行测试
testDirectPDF();
