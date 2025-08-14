import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/templates - 获取所有合同模板
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (status) {
      where.status = status;
    }

    const [templates, total] = await Promise.all([
      prisma.contractTemplate.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.contractTemplate.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取合同模板失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取合同模板失败'
      },
      { status: 500 }
    );
  }
}

// POST /api/templates - 创建新的合同模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      categoryId, 
      filePath, 
      fileName, 
      fileSize, 
      mimeType 
    } = body;

    if (!name || !filePath || !fileName) {
      return NextResponse.json(
        {
          success: false,
          error: '模板名称、文件路径和文件名不能为空'
        },
        { status: 400 }
      );
    }

    const template = await prisma.contractTemplate.create({
      data: {
        name,
        description,
        categoryId,
        filePath,
        fileName,
        fileSize,
        mimeType,
        status: 'processing' // 初始状态为处理中
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('创建合同模板失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建合同模板失败'
      },
      { status: 500 }
    );
  }
}
