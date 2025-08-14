import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { analyzeContractTemplate } from '@/lib/gemini';

// POST /api/templates/analyze - 分析合同模板并提取变量
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, content } = body;

    if (!templateId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: '模板ID和内容不能为空'
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

    // 使用Gemini AI分析模板
    const analysisResult = await analyzeContractTemplate(content);

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

    return NextResponse.json({
      success: true,
      data: {
        variables,
        confidence: analysisResult.confidence,
        suggestions: analysisResult.suggestions
      }
    });

  } catch (error) {
    console.error('模板分析失败:', error);
    
    // 如果是AI分析失败，更新模板状态但不返回错误
    const body = await request.json().catch(() => ({}));
    if (body.templateId) {
      await prisma.contractTemplate.update({
        where: { id: body.templateId },
        data: { status: 'active' }
      }).catch(console.error);
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
