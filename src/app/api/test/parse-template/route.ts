import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/document-processor';
import { formatPreservingGenerator } from '@/lib/format-preserving-generator';
import fs from 'fs';

// POST /api/test/parse-template - 测试模板解析功能
export async function POST(request: NextRequest) {
  try {
    console.log('开始测试模板解析功能');

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: '请选择要测试的模板文件'
        },
        { status: 400 }
      );
    }

    console.log('测试文件信息:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 第一步：解析文档
    console.log('步骤1: 解析文档...');
    const parseResult = await documentProcessor.parseDocumentFromFile(file);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: `文档解析失败: ${parseResult.error}`,
        step: 'parse'
      });
    }

    console.log('文档解析成功:', {
      contentLength: parseResult.content?.length,
      markdownLength: parseResult.markdown?.length,
      metadata: parseResult.metadata
    });

    // 第二步：模拟变量替换
    console.log('步骤2: 模拟变量替换...');
    const testVariables = {
      '甲方名称': '广州南沙开发区管理委员会',
      '乙方名称': '比亚迪汽车销售有限公司',
      '合同金额': '280000',
      '签订日期': '2025年1月18日',
      '签订地点': '广州市南沙区',
      'buyerName': '广州南沙开发区管理委员会',
      'supplierName': '比亚迪汽车销售有限公司',
      'totalAmount': '280000',
      'signingDate': '2025年1月18日',
      'signingLocation': '广州市南沙区'
    };

    const replacements = Object.entries(testVariables).map(([key, value]) => ({
      placeholder: key,
      value,
      type: 'text' as const
    }));

    const processedMarkdown = documentProcessor.replaceVariablesInMarkdown(
      parseResult.markdown || '',
      replacements
    );

    console.log('变量替换完成，处理后长度:', processedMarkdown.length);

    // 第三步：生成Word文档
    console.log('步骤3: 生成Word文档...');
    const genResult = await formatPreservingGenerator.generateWordFromMarkdown(
      processedMarkdown,
      {
        preserveFormatting: true,
        fontFamily: '宋体',
        fontSize: 24
      }
    );

    if (!genResult.success) {
      return NextResponse.json({
        success: false,
        error: `Word生成失败: ${genResult.error}`,
        step: 'generate',
        parseResult: {
          success: true,
          contentPreview: parseResult.content?.substring(0, 500),
          markdownPreview: parseResult.markdown?.substring(0, 500),
          metadata: parseResult.metadata
        }
      });
    }

    console.log('Word文档生成成功');

    // 返回测试结果
    return NextResponse.json({
      success: true,
      message: '模板解析和生成测试成功',
      results: {
        parsing: {
          success: true,
          contentLength: parseResult.content?.length,
          markdownLength: parseResult.markdown?.length,
          metadata: parseResult.metadata
        },
        variableReplacement: {
          success: true,
          replacedCount: replacements.length,
          processedLength: processedMarkdown.length
        },
        wordGeneration: {
          success: true,
          bufferSize: genResult.buffer?.length,
          metadata: genResult.metadata
        }
      },
      previews: {
        originalContent: parseResult.content?.substring(0, 1000),
        originalMarkdown: parseResult.markdown?.substring(0, 1000),
        processedMarkdown: processedMarkdown.substring(0, 1000)
      }
    });

  } catch (error) {
    console.error('测试解析失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        step: 'unknown'
      },
      { status: 500 }
    );
  }
}

// GET /api/test/parse-template - 测试参考模板文件
export async function GET() {
  try {
    const referenceFilePath = 'E:\\trae\\0814合同\\舶源-金港【金港模板】（上牌）.doc';
    
    // 检查文件是否存在
    if (!fs.existsSync(referenceFilePath)) {
      return NextResponse.json({
        success: false,
        error: '参考模板文件不存在',
        filePath: referenceFilePath
      });
    }

    // 读取文件信息
    const stats = fs.statSync(referenceFilePath);
    
    return NextResponse.json({
      success: true,
      message: '参考模板文件信息',
      fileInfo: {
        path: referenceFilePath,
        size: stats.size,
        modified: stats.mtime,
        exists: true
      },
      instructions: {
        step1: '使用POST方法上传模板文件进行测试',
        step2: '系统将自动解析文档并进行变量替换测试',
        step3: '检查生成的Word文档是否保持原始格式'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`
    });
  }
}
