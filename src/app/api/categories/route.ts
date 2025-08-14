import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/categories - 获取所有合同分类
export async function GET() {
  try {
    const categories = await prisma.contractCategory.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            templates: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取合同分类失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取合同分类失败'
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - 创建新的合同分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: '分类名称不能为空'
        },
        { status: 400 }
      );
    }

    const category = await prisma.contractCategory.create({
      data: {
        name,
        description,
        color: color || '#3B82F6'
      }
    });

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error: unknown) {
    console.error('创建合同分类失败:', error);
    
    // 处理唯一约束错误
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: '分类名称已存在'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: '创建合同分类失败'
      },
      { status: 500 }
    );
  }
}
