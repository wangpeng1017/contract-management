import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/templates/[id] - 获取单个模板详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const template = await prisma.contractTemplate.findUnique({
      where: { id },
      include: {
        category: true,
        variables: {
          orderBy: {
            orderIndex: 'asc'
          }
        },
        _count: {
          select: {
            variables: true,
            generatedContracts: true
          }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('获取模板详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取模板详情失败'
      },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - 更新模板信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, categoryId, status } = body;

    const template = await prisma.contractTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(status && { status })
      },
      include: {
        category: true,
        variables: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新模板失败'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 删除模板（会级联删除相关的变量和生成的合同）
    await prisma.contractTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '模板删除成功'
    });

  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除模板失败'
      },
      { status: 500 }
    );
  }
}
