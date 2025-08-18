import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-6xl mb-6">
          智能合同管理系统
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          基于AI技术的智能合同管理平台，支持合同模板管理、智能变量识别、
          表单式和对话式合同生成，让合同处理更加高效便捷。
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/templates">开始使用</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/chat">智能对话</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📄 模板管理
              </CardTitle>
              <CardDescription>
                上传和管理各类合同模板，支持分类整理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                支持.docx格式的合同模板上传，自动分类管理，
                便于后续的合同生成和维护。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI智能识别
              </CardTitle>
              <CardDescription>
                自动识别合同中的变量字段
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                基于Google Gemini AI技术，自动识别合同模板中的
                变量字段，智能分类和标注。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 表单生成
              </CardTitle>
              <CardDescription>
                基于模板快速生成填写表单
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                根据识别的变量自动生成表单界面，
                用户填写后即可生成完整合同。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 对话生成
              </CardTitle>
              <CardDescription>
                通过智能对话收集合同信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                创新的对话式交互方式，通过自然语言对话
                收集合同信息，体验更加友好。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👁️ 实时预览
              </CardTitle>
              <CardDescription>
                实时预览生成的合同内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                支持合同内容的实时预览，确保生成的
                合同格式正确、内容完整。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📥 PDF导出
              </CardTitle>
              <CardDescription>
                一键导出PDF格式合同
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                生成的合同可以一键导出为PDF格式，
                便于打印、签署和存档。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-12 bg-muted/50 rounded-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">快速开始</h2>
          <p className="text-lg text-muted-foreground mb-8">
            三步即可生成您的第一份智能合同
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">上传模板</h3>
              <p className="text-muted-foreground">
                上传您的合同模板文件，系统将自动识别变量
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">填写信息</h3>
              <p className="text-muted-foreground">
                通过表单或对话方式填写合同相关信息
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">生成合同</h3>
              <p className="text-muted-foreground">
                预览并导出您的专业合同文档
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/templates">立即开始</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/generate">生成合同</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/test">功能测试</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/test-feishu">飞书集成</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
