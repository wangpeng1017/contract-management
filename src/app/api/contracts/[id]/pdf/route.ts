import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { jsPDF } from 'jspdf';

// GET /api/contracts/[id]/pdf - 生成并下载合同PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 获取合同详情
    const contract = await prisma.generatedContract.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            category: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: '合同不存在'
        },
        { status: 404 }
      );
    }

    // 生成PDF
    const pdfBuffer = await generateContractPDF(contract);

    // 更新合同状态为已下载
    await prisma.generatedContract.update({
      where: { id },
      data: { status: 'downloaded' }
    });

    // 返回PDF文件
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contract.templateName}_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF生成失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF生成失败'
      },
      { status: 500 }
    );
  }
}

// 生成合同PDF
async function generateContractPDF(contract: {
  id: string;
  templateName: string;
  content: string;
  template?: {
    category?: {
      name: string;
    };
  };
}): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 设置中文字体（这里使用默认字体，实际应用中需要加载中文字体）
  doc.setFont('helvetica');
  
  // 设置标题
  doc.setFontSize(20);
  doc.text(contract.templateName || '合同', 105, 30, { align: 'center' });
  
  // 设置内容
  doc.setFontSize(12);
  
  // 分割合同内容为行
  const lines = contract.content.split('\n');
  let yPosition = 50;
  const lineHeight = 7;
  const pageHeight = 297; // A4页面高度
  const margin = 20;
  
  for (const line of lines) {
    // 检查是否需要换页
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    // 处理长行文本换行
    if (line.length > 0) {
      const wrappedLines = doc.splitTextToSize(line, 170); // 170mm宽度
      
      for (const wrappedLine of wrappedLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(wrappedLine, margin, yPosition);
        yPosition += lineHeight;
      }
    } else {
      yPosition += lineHeight / 2; // 空行
    }
  }
  
  // 添加页脚
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `第 ${i} 页，共 ${pageCount} 页`,
      105,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // 添加生成时间
    doc.text(
      `生成时间: ${new Date().toLocaleString('zh-CN')}`,
      margin,
      pageHeight - 10
    );
  }
  
  // 返回PDF缓冲区
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
