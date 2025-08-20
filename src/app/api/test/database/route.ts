import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET /api/test/database - 测试数据库连接
export async function GET(request: NextRequest) {
  try {
    console.log('开始测试数据库连接... [部署验证: 2025-08-20T07:03]');
    
    // 测试基本连接
    const startTime = Date.now();
    await prisma.$connect();
    const connectTime = Date.now() - startTime;
    console.log('数据库连接成功，耗时:', connectTime, 'ms');
    
    // 测试查询操作
    const queryStartTime = Date.now();
    const templateCount = await prisma.contractTemplate.count();
    const queryTime = Date.now() - queryStartTime;
    console.log('模板数量查询成功，耗时:', queryTime, 'ms', '模板数量:', templateCount);
    
    // 测试获取一个模板
    const sampleTemplate = await prisma.contractTemplate.findFirst({
      include: {
        variables: true
      }
    });
    
    // 测试生成的合同数量
    const contractCount = await prisma.generatedContract.count();
    
    return NextResponse.json({
      success: true,
      data: {
        connection: {
          status: 'connected',
          connectTime: `${connectTime}ms`,
          queryTime: `${queryTime}ms`
        },
        statistics: {
          templateCount,
          contractCount,
          sampleTemplate: sampleTemplate ? {
            id: sampleTemplate.id,
            name: sampleTemplate.name,
            variableCount: sampleTemplate.variables.length
          } : null
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasPrismaDatabaseUrl: !!process.env.PRISMA_DATABASE_URL
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: `数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      details: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasPrismaDatabaseUrl: !!process.env.PRISMA_DATABASE_URL
        },
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  } finally {
    // 确保断开连接
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('断开数据库连接时出现警告:', disconnectError);
    }
  }
}
