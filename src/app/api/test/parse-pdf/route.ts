import { NextRequest, NextResponse } from 'next/server';
import { pdfDocumentProcessor } from '@/lib/pdf-document-processor';
import { pdfFormatPreservingGenerator } from '@/lib/pdf-format-preserving-generator';
import fs from 'fs';

// POST /api/test/parse-pdf - 测试PDF模板解析功能
export async function POST(request: NextRequest) {
  try {
    console.log('开始测试PDF模板解析功能');

    // 获取上传的PDF文件
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: '请选择要测试的PDF模板文件'
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        {
          success: false,
          error: '请上传PDF格式的文件'
        },
        { status: 400 }
      );
    }

    console.log('测试PDF文件信息:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 第一步：解析PDF文档
    console.log('步骤1: 解析PDF文档...');
    const parseResult = await pdfDocumentProcessor.parseDocumentFromFile(file);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: `PDF文档解析失败: ${parseResult.error}`,
        step: 'parse'
      });
    }

    console.log('PDF文档解析成功:', {
      contentLength: parseResult.content?.length,
      pageCount: parseResult.metadata?.pageCount,
      hasImages: parseResult.metadata?.hasImages,
      hasTables: parseResult.metadata?.hasTables
    });

    // 第二步：模拟变量替换
    console.log('步骤2: 模拟PDF变量替换...');
    const testVariables = [
      {
        placeholder: '[甲方名称]',
        value: '广州南沙开发区管理委员会',
        type: 'text' as const
      },
      {
        placeholder: '[乙方名称]',
        value: '比亚迪汽车销售有限公司',
        type: 'text' as const
      },
      {
        placeholder: '[合同金额]',
        value: '280000',
        type: 'currency' as const
      },
      {
        placeholder: '[签订日期]',
        value: '2025年1月18日',
        type: 'date' as const
      },
      {
        placeholder: '[签订地点]',
        value: '广州市南沙区',
        type: 'text' as const
      },
      {
        placeholder: '{{甲方名称}}',
        value: '广州南沙开发区管理委员会',
        type: 'text' as const
      },
      {
        placeholder: '{{乙方名称}}',
        value: '比亚迪汽车销售有限公司',
        type: 'text' as const
      },
      {
        placeholder: '${合同金额}',
        value: '280000',
        type: 'currency' as const
      }
    ];

    console.log('准备变量替换，变量数量:', testVariables.length);

    // 第三步：生成Word文档
    console.log('步骤3: 生成Word文档...');
    const genResult = await pdfFormatPreservingGenerator.generateWordFromPDF(
      parseResult,
      testVariables,
      {
        preserveFormatting: true,
        fontFamily: '宋体',
        fontSize: 12,
        pageMargins: { top: 720, bottom: 720, left: 720, right: 720 }
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
          metadata: parseResult.metadata,
          pageCount: parseResult.pages?.length || 0
        }
      });
    }

    console.log('Word文档生成成功');

    // 返回测试结果
    return NextResponse.json({
      success: true,
      message: 'PDF模板解析和生成测试成功',
      results: {
        parsing: {
          success: true,
          contentLength: parseResult.content?.length,
          pageCount: parseResult.metadata?.pageCount,
          hasImages: parseResult.metadata?.hasImages,
          hasTables: parseResult.metadata?.hasTables,
          metadata: parseResult.metadata
        },
        variableReplacement: {
          success: true,
          replacedCount: testVariables.length,
          variables: testVariables.map(v => ({
            placeholder: v.placeholder,
            type: v.type,
            value: v.value
          }))
        },
        wordGeneration: {
          success: true,
          bufferSize: genResult.buffer?.length,
          metadata: genResult.metadata
        }
      },
      previews: {
        originalContent: parseResult.content?.substring(0, 1000),
        layoutInfo: {
          paragraphCount: parseResult.layoutInfo?.paragraphs.length || 0,
          tableCount: parseResult.layoutInfo?.tables.length || 0,
          headerCount: parseResult.layoutInfo?.headers.length || 0
        },
        pageInfo: parseResult.pages?.map(page => ({
          pageNumber: page.pageNumber,
          textLength: page.text.length,
          textItemCount: page.textItems.length,
          hasImages: (page.images?.length || 0) > 0
        }))
      }
    });

  } catch (error) {
    console.error('测试PDF解析失败:', error);
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

// GET /api/test/parse-pdf - 测试参考PDF模板文件
export async function GET() {
  try {
    const referenceFilePath = 'E:\\trae\\0814合同\\舶源-金港【金港模板】（上牌）.pdf';
    
    // 检查文件是否存在
    if (!fs.existsSync(referenceFilePath)) {
      return NextResponse.json({
        success: false,
        error: '参考PDF模板文件不存在',
        filePath: referenceFilePath
      });
    }

    // 读取文件信息
    const stats = fs.statSync(referenceFilePath);
    
    return NextResponse.json({
      success: true,
      message: '参考PDF模板文件信息',
      fileInfo: {
        path: referenceFilePath,
        size: stats.size,
        modified: stats.mtime,
        exists: true,
        type: 'PDF'
      },
      instructions: {
        step1: '使用POST方法上传PDF模板文件进行测试',
        step2: '系统将自动解析PDF文档并进行变量替换测试',
        step3: '检查生成的Word文档是否保持原始PDF格式',
        features: [
          'PDF文本内容提取',
          '布局结构分析',
          '变量占位符识别',
          '格式保真Word生成',
          '多种占位符格式支持: [变量], {{变量}}, ${变量}'
        ]
      },
      testCapabilities: {
        supportedFormats: ['PDF'],
        outputFormats: ['Word (.docx)'],
        variableTypes: ['text', 'currency', 'date', 'percentage'],
        preservedElements: ['文本', '段落', '表格', '标题', '字体样式', '布局结构']
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `获取文件信息失败: ${error instanceof Error ? error.message : '未知错误'}`
    });
  }
}

// DELETE /api/test/parse-pdf - 清理测试文件
export async function DELETE() {
  try {
    // 清理临时文件
    const tempDir = './temp';
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith('page') && (file.endsWith('.png') || file.endsWith('.jpg'))) {
          fs.unlinkSync(`${tempDir}/${file}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '测试文件清理完成'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `清理失败: ${error instanceof Error ? error.message : '未知错误'}`
    });
  }
}
