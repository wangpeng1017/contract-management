import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;

    // 从数据库获取合同
    const contract = await prisma.generatedContract.findUnique({
      where: { id: contractId },
      include: {
        template: true
      }
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: '合同不存在' },
        { status: 404 }
      );
    }

    // 解析变量数据
    const variablesData = contract.variablesData as Record<string, unknown>;
    const goodsItems = (variablesData?.goodsItems as Array<Record<string, unknown>>) || [];

    // 创建Word文档
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // 标题
            new Paragraph({
              children: [
                new TextRun({
                  text: contract.template?.name || '合同',
                  bold: true,
                  size: 32,
                }),
              ],
              alignment: 'center',
              spacing: { after: 400 },
            }),

            // 合同内容
            ...contract.content.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              })
            ),

            // 货物信息表格（如果有）
            ...(goodsItems.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: '货物信息明细',
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { before: 400, after: 200 },
              }),

              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  // 表头
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '序号', bold: true })] })],
                        width: { size: 10, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '车型商品名称', bold: true })] })],
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '指导价(元)', bold: true })] })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '采购单价含税(元)', bold: true })] })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '数量(辆)', bold: true })] })],
                        width: { size: 10, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '含税总价(元)', bold: true })] })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: '不含税总价(元)', bold: true })] })],
                        width: { size: 15, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  // 数据行
                  ...goodsItems.map((item: Record<string, unknown>, index: number) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString() })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: String(item.vehicleModel || '') })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: Number(item.guidePrice || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: Number(item.unitPriceWithTax || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: String(item.quantity || 0) })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: Number(item.totalPriceWithTax || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) })] })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: Number(item.totalPriceWithoutTax || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) })] })],
                        }),
                      ],
                    })
                  ),
                ],
              }),
            ] : []),

            // 签名区域
            new Paragraph({
              children: [
                new TextRun({
                  text: '\n\n甲方（盖章）：_________________    乙方（盖章）：_________________',
                  size: 24,
                }),
              ],
              spacing: { before: 600 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `签订日期：${variablesData?.signingDate || '____年____月____日'}`,
                  size: 24,
                }),
              ],
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    // 生成Word文档
    const buffer = await Packer.toBuffer(doc);

    // 返回Word文档
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${contract.template?.name || 'contract'}_${new Date().toISOString().split('T')[0]}.docx"`,
      },
    });

  } catch (error) {
    console.error('Word导出失败:', error);
    return NextResponse.json(
      { success: false, error: 'Word导出失败' },
      { status: 500 }
    );
  }
}
