import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { generateChatQuestion, validateUserInput } from '@/lib/gemini';

// GET /api/chat/[id] - 获取聊天会话详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '聊天会话不存在'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('获取聊天会话详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取聊天会话详情失败'
      },
      { status: 500 }
    );
  }
}

// POST /api/chat/[id] - 发送消息到聊天会话
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: '消息内容不能为空'
        },
        { status: 400 }
      );
    }

    // 获取会话信息
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '聊天会话不存在'
        },
        { status: 404 }
      );
    }

    // 创建用户消息
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: 'user',
        content: content.trim()
      }
    });

    // 处理用户输入并生成回复
    let assistantReply = '感谢您的回复！';
    // eslint-disable-next-line prefer-const
    let updatedVariables = typeof session.collectedVariables === 'object' && session.collectedVariables !== null
      ? { ...session.collectedVariables as Record<string, unknown> }
      : {} as Record<string, unknown>;

    if (session.templateId) {
      // 获取模板信息
      const template = await prisma.contractTemplate.findUnique({
        where: { id: session.templateId },
        include: {
          variables: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      });

      if (template) {
        // 确定当前正在收集的变量
        const collectedCount = Object.keys(updatedVariables).length;
        const currentVariable = template.variables[collectedCount];

        if (currentVariable) {
          // 验证用户输入
          try {
            const validation = await validateUserInput(content, {
              name: currentVariable.name,
              type: currentVariable.type,
              description: currentVariable.description || '',
              required: currentVariable.required
            });
            
            if (validation.isValid) {
              // 保存验证后的值
              updatedVariables[currentVariable.name] = validation.normalizedValue || content;
              
              // 检查是否还有更多变量需要收集
              const nextVariable = template.variables[collectedCount + 1];
              
              if (nextVariable) {
                // 生成下一个问题
                try {
                  const nextQuestion = await generateChatQuestion(template.name, {
                    name: nextVariable.name,
                    type: nextVariable.type,
                    description: nextVariable.description || '',
                    required: nextVariable.required
                  }, updatedVariables);
                  assistantReply = `很好！${nextQuestion}`;
                } catch (error) {
                  console.error('生成下一个问题失败:', error);
                  assistantReply = `很好！请提供${nextVariable.description || '相关信息'}：`;
                }
              } else {
                // 所有变量都收集完了
                assistantReply = `太好了！我已经收集到了所有必要的信息。您现在可以生成合同了。\n\n收集到的信息：\n${template.variables.map(v => `• ${v.description}: ${updatedVariables[v.name]}`).join('\n')}`;
                
                // 更新会话状态为完成
                await prisma.chatSession.update({
                  where: { id },
                  data: {
                    status: 'completed',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    collectedVariables: updatedVariables as any
                  }
                });
              }
            } else {
              // 验证失败，要求重新输入
              assistantReply = `${validation.error}${validation.suggestion ? `\n\n${validation.suggestion}` : ''}`;
            }
          } catch (error) {
            console.error('验证用户输入失败:', error);
            // 保存原始输入
            updatedVariables[currentVariable.name] = content;
            assistantReply = '已记录您的回复。请继续下一项信息。';
          }
        } else {
          assistantReply = '看起来我们已经收集了所有必要的信息。您可以开始生成合同了！';
        }
      }
    } else {
      // 没有指定模板的通用对话
      assistantReply = '我理解了您的需求。请告诉我您需要什么类型的合同，我可以帮助您选择合适的模板。';
    }

    // 更新会话的收集变量（如果有变化）
    if (JSON.stringify(updatedVariables) !== JSON.stringify(session.collectedVariables)) {
      await prisma.chatSession.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { collectedVariables: updatedVariables as any }
      });
    }

    // 创建助手回复消息
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: 'assistant',
        content: assistantReply
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        collectedVariables: updatedVariables
      }
    });

  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '发送消息失败'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/[id] - 删除聊天会话
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.chatSession.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '聊天会话已删除'
    });

  } catch (error) {
    console.error('删除聊天会话失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除聊天会话失败'
      },
      { status: 500 }
    );
  }
}
