import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { generateChatQuestion } from '@/lib/gemini';

// GET /api/chat - 获取聊天会话列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await prisma.chatSession.findMany({
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // 只获取第一条消息作为预览
        }
      }
    });

    const total = await prisma.chatSession.count();

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('获取聊天会话列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取聊天会话列表失败'
      },
      { status: 500 }
    );
  }
}

// POST /api/chat - 创建新的聊天会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId } = body;

    // 创建新的聊天会话
    const session = await prisma.chatSession.create({
      data: {
        templateId,
        collectedVariables: {},
        status: 'active'
      }
    });

    // 如果指定了模板，获取模板信息并生成欢迎消息
    let welcomeMessage = '您好！我是智能合同助手，我将帮助您填写合同信息。请告诉我您需要什么帮助？';
    
    if (templateId) {
      const template = await prisma.contractTemplate.findUnique({
        where: { id: templateId },
        include: {
          variables: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });

      if (template) {
        welcomeMessage = `您好！我将帮助您填写"${template.name}"合同。让我们开始收集必要的信息吧！`;
        
        // 如果有变量，生成第一个问题
        if (template.variables.length > 0) {
          const firstVariable = template.variables[0];
          try {
            const question = await generateChatQuestion(template.name, {
              name: firstVariable.name,
              type: firstVariable.type,
              description: firstVariable.description || '',
              required: firstVariable.required
            });
            welcomeMessage += `\n\n${question}`;
          } catch (error) {
            console.error('生成问题失败:', error);
            welcomeMessage += `\n\n请提供${firstVariable.description || '相关信息'}：`;
          }
        }
      }
    }

    // 创建欢迎消息
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: welcomeMessage
      }
    });

    // 返回会话信息和欢迎消息
    const sessionWithMessages = await prisma.chatSession.findUnique({
      where: { id: session.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: sessionWithMessages
    });

  } catch (error) {
    console.error('创建聊天会话失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建聊天会话失败'
      },
      { status: 500 }
    );
  }
}
