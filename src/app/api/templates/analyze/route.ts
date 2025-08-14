import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { analyzeContractTemplate } from '@/lib/gemini';
import { getFileInfo } from '@/lib/blob-storage';
import { parseDocument } from '@/lib/document-parser';

// POST /api/templates/analyze - 分析合同模板并提取变量
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, content, filePath } = body;

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: '模板ID不能为空'
        },
        { status: 400 }
      );
    }

    // 检查模板是否存在
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: '模板不存在'
        },
        { status: 404 }
      );
    }

    let documentContent = content;

    // 如果没有提供内容但有文件路径，尝试解析文档
    if (!documentContent && template.filePath) {
      try {
        // 这里应该从Blob存储获取文件并解析
        // 由于演示目的，我们使用模拟内容
        const mockFile = new File([''], template.fileName, { type: template.mimeType || 'application/octet-stream' });
        const parseResult = await parseDocument(mockFile);

        if (parseResult.success) {
          documentContent = parseResult.content;
        } else {
          throw new Error(parseResult.error || '文档解析失败');
        }
      } catch (parseError) {
        console.error('文档解析失败:', parseError);
        // 如果解析失败，使用默认内容
        documentContent = `合同模板：${template.name}\n\n[请手动添加合同内容进行分析]`;
      }
    }

    if (!documentContent) {
      return NextResponse.json(
        {
          success: false,
          error: '无法获取合同内容，请提供内容或确保文件可访问'
        },
        { status: 400 }
      );
    }

    // 使用Gemini AI分析模板
    console.log('开始AI分析，模板ID:', templateId);
    const analysisResult = await analyzeContractTemplate(documentContent);

    // 删除现有变量（如果有）
    await prisma.contractVariable.deleteMany({
      where: { templateId }
    });

    // 保存分析结果到数据库
    const variables = await Promise.all(
      analysisResult.variables.map(async (variable, index) => {
        return await prisma.contractVariable.create({
          data: {
            templateId,
            name: variable.name,
            type: variable.type,
            description: variable.description,
            required: variable.required,
            placeholder: variable.placeholder,
            orderIndex: index
          }
        });
      })
    );

    // 更新模板状态
    await prisma.contractTemplate.update({
      where: { id: templateId },
      data: {
        status: 'active',
        variablesExtracted: true
      }
    });

    console.log(`AI分析完成，识别到 ${variables.length} 个变量`);

    return NextResponse.json({
      success: true,
      data: {
        variables,
        confidence: analysisResult.confidence,
        suggestions: analysisResult.suggestions,
        analyzedContent: documentContent.substring(0, 500) + '...' // 返回部分内容用于验证
      }
    });

  } catch (error) {
    console.error('模板分析失败:', error);

    // 如果是AI分析失败，更新模板状态但不返回错误
    try {
      const body = await request.json().catch(() => ({}));
      if (body.templateId) {
        await prisma.contractTemplate.update({
          where: { id: body.templateId },
          data: { status: 'active' }
        }).catch(console.error);
      }
    } catch (updateError) {
      console.error('更新模板状态失败:', updateError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '模板分析失败'
      },
      { status: 500 }
    );
  }
}
