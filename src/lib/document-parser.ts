// 文档解析工具
// 由于浏览器环境限制，这里提供基础的文本提取功能
// 在实际生产环境中，建议使用服务端的文档解析库

export interface DocumentParseResult {
  content: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    pageCount?: number;
  };
  success: boolean;
  error?: string;
}

// 模拟文档内容提取（实际应用中需要使用专门的文档解析库）
export async function parseDocument(file: File): Promise<DocumentParseResult> {
  try {
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };

    // 对于演示目的，我们返回一个示例合同内容
    // 在实际应用中，这里应该使用专门的文档解析库来提取真实内容
    const sampleContent = generateSampleContractContent(file.name);

    return {
      content: sampleContent,
      metadata,
      success: true
    };

  } catch (error) {
    console.error('文档解析失败:', error);
    return {
      content: '',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      },
      success: false,
      error: error instanceof Error ? error.message : '文档解析失败'
    };
  }
}

// 生成示例合同内容（用于演示）
function generateSampleContractContent(fileName: string): string {
  const contractType = detectContractType(fileName);
  
  switch (contractType) {
    case 'purchase':
      return `
采购合同

甲方（采购方）：[公司名称]
地址：[公司地址]
联系人：[联系人姓名]
电话：[联系电话]
邮箱：[邮箱地址]

乙方（供应方）：[供应商名称]
地址：[供应商地址]
联系人：[联系人姓名]
电话：[联系电话]
邮箱：[邮箱地址]

合同编号：[合同编号]
签订日期：[签订日期]

一、采购物品
物品名称：[物品名称]
规格型号：[规格型号]
数量：[数量]
单价：[单价]元
总价：[总价]元

二、交付条款
交付地点：[交付地点]
交付日期：[交付日期]
验收标准：[验收标准]

三、付款条款
付款方式：[付款方式]
定金比例：[定金比例]%
尾款支付时间：[尾款支付时间]

四、违约责任
[违约责任条款]

甲方签字：_____________ 日期：_____________
乙方签字：_____________ 日期：_____________
`;

    case 'sales':
      return `
销售合同

甲方（销售方）：[公司名称]
地址：[公司地址]
联系人：[联系人姓名]
电话：[联系电话]

乙方（购买方）：[客户名称]
地址：[客户地址]
联系人：[联系人姓名]
电话：[联系电话]

合同编号：[合同编号]
签订日期：[签订日期]

一、销售商品
商品名称：[商品名称]
规格：[商品规格]
数量：[销售数量]
单价：[销售单价]元
总金额：[总金额]元

二、交付安排
交付时间：[交付时间]
交付地点：[交付地点]
运输方式：[运输方式]

三、付款条件
付款方式：[付款方式]
付款期限：[付款期限]
开票信息：[开票信息]

甲方（盖章）：_____________ 
乙方（盖章）：_____________
签订日期：[签订日期]
`;

    case 'foreign_trade':
      return `
外贸合同

买方（Buyer）：[买方名称]
地址（Address）：[买方地址]
联系人（Contact）：[联系人]
电话（Tel）：[电话号码]

卖方（Seller）：[卖方名称]
地址（Address）：[卖方地址]
联系人（Contact）：[联系人]
电话（Tel）：[电话号码]

合同号（Contract No.）：[合同编号]
日期（Date）：[签订日期]

一、商品描述（Commodity Description）
商品名称（Name）：[商品名称]
规格（Specification）：[商品规格]
数量（Quantity）：[数量]
单价（Unit Price）：[单价] USD
总价（Total Amount）：[总价] USD

二、贸易条款（Trade Terms）
贸易术语：[FOB/CIF/CFR等]
装运港：[装运港]
目的港：[目的港]

三、付款条件（Payment Terms）
付款方式：[L/C/T/T等]
付款期限：[付款期限]

四、装运条款（Shipment Terms）
装运期：[装运期]
分批装运：[允许/不允许]
转运：[允许/不允许]

买方签字：_____________ 
卖方签字：_____________
`;

    default:
      return `
合同

甲方：[甲方名称]
地址：[甲方地址]
联系人：[联系人]
电话：[联系电话]

乙方：[乙方名称]
地址：[乙方地址]
联系人：[联系人]
电话：[联系电话]

合同编号：[合同编号]
签订日期：[签订日期]

一、合同内容
[合同具体内容]

二、权利义务
甲方权利义务：[甲方权利义务]
乙方权利义务：[乙方权利义务]

三、合同金额
总金额：[合同金额]元
付款方式：[付款方式]

四、履行期限
开始时间：[开始时间]
结束时间：[结束时间]

甲方签字：_____________ 
乙方签字：_____________
签订日期：[签订日期]
`;
  }
}

// 根据文件名检测合同类型
function detectContractType(fileName: string): string {
  const name = fileName.toLowerCase();
  
  if (name.includes('采购') || name.includes('purchase')) {
    return 'purchase';
  } else if (name.includes('销售') || name.includes('sales')) {
    return 'sales';
  } else if (name.includes('外贸') || name.includes('foreign') || name.includes('export') || name.includes('import')) {
    return 'foreign_trade';
  } else if (name.includes('上牌') || name.includes('registration')) {
    return 'vehicle_registration';
  } else if (name.includes('服务') || name.includes('service')) {
    return 'service';
  }
  
  return 'general';
}
