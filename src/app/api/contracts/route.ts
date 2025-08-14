import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/contracts - 获取生成的合同列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (templateId) {
      where.templateId = templateId;
    }
    
    if (status) {
      where.status = status;
    }

    const [contracts, total] = await Promise.all([
      prisma.generatedContract.findMany({
        where,
        include: {
          template: {
            select: {
              name: true,
              category: {
                select: {
                  name: true,
                  color: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.generatedContract.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        contracts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取合同列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取合同列表失败'
      },
      { status: 500 }
    );
  }
}
