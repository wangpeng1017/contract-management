'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  templateId?: string;
  status: string;
  collectedVariables: Record<string, unknown>;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // 加载聊天会话列表
  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch('/api/chat');
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data.sessions);
      }
    } catch (error) {
      console.error('加载聊天会话失败:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('加载模板列表失败:', error);
    }
  };

  // 创建新的聊天会话
  const createNewSession = async (templateId?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentSession(result.data);
        await loadSessions(); // 刷新会话列表
      } else {
        alert('创建聊天会话失败: ' + result.error);
      }
    } catch (error) {
      console.error('创建聊天会话失败:', error);
      alert('创建聊天会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载聊天会话详情
  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/${sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        setCurrentSession(result.data);
      } else {
        alert('加载聊天会话失败: ' + result.error);
      }
    } catch (error) {
      console.error('加载聊天会话失败:', error);
      alert('加载聊天会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat/${currentSession.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: userMessage })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新当前会话的消息
        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              result.data.userMessage,
              result.data.assistantMessage
            ],
            collectedVariables: result.data.collectedVariables
          };
        });
        
        // 刷新会话列表
        await loadSessions();
      } else {
        alert('发送消息失败: ' + result.error);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理回车键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    loadSessions();
    loadTemplates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">智能对话</h1>
          <p className="mt-2 text-gray-600">
            通过智能对话快速收集合同信息，让AI助手帮您填写合同
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧：会话列表和模板选择 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 新建会话 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">新建对话</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => createNewSession()}
                  disabled={isLoading}
                  className="w-full"
                >
                  通用对话
                </Button>
                
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">选择模板开始：</p>
                    {templates.slice(0, 3).map(template => (
                      <Button
                        key={template.id}
                        variant="outline"
                        onClick={() => createNewSession(template.id)}
                        disabled={isLoading}
                        className="w-full text-left justify-start"
                      >
                        {template.name}
                      </Button>
                    ))}
                    {templates.length > 3 && (
                      <Link href="/templates">
                        <Button variant="link" className="w-full">
                          查看更多模板 →
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 历史会话 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">历史对话</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <p className="text-gray-500">加载中...</p>
                ) : sessions.length === 0 ? (
                  <p className="text-gray-500">暂无历史对话</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => loadSession(session.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          currentSession?.id === session.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {session.messages[0]?.content.slice(0, 30)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(session.updatedAt)}
                        </div>
                        <div className={`text-xs mt-1 ${
                          session.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {session.status === 'completed' ? '已完成' : '进行中'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：聊天界面 */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>
                  {currentSession ? '智能对话' : '选择或创建新对话'}
                </CardTitle>
                {currentSession && (
                  <CardDescription>
                    会话状态: {currentSession.status === 'completed' ? '已完成' : '进行中'}
                    {currentSession.status === 'completed' && (
                      <Link href={`/generate?template=${currentSession.templateId}`}>
                        <Button variant="link" className="ml-2 p-0 h-auto">
                          生成合同 →
                        </Button>
                      </Link>
                    )}
                  </CardDescription>
                )}
              </CardHeader>
              
              {currentSession ? (
                <>
                  {/* 消息列表 */}
                  <CardContent className="flex-1 overflow-y-auto space-y-4">
                    {currentSession.messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          <div className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </CardContent>

                  {/* 输入框 */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入您的消息..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={isLoading || !message.trim()}
                      >
                        {isLoading ? '发送中...' : '发送'}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">欢迎使用智能对话功能</p>
                    <p>请选择一个历史对话或创建新的对话开始</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
