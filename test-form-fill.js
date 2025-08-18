// 快速填写表单的测试脚本
// 在浏览器控制台中运行

function fillFormQuickly() {
  // 填写基础信息
  const contractIdInput = document.querySelector('input[placeholder="请输入合同编号"]');
  if (contractIdInput) {
    contractIdInput.value = 'HT-2025-001';
    contractIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    contractIdInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  const signDateInput = document.querySelector('input[type="date"]');
  if (signDateInput) {
    signDateInput.value = '2025-01-15';
    signDateInput.dispatchEvent(new Event('input', { bubbles: true }));
    signDateInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 填写甲方信息
  const buyerFields = [
    { selector: 'input[placeholder="广州有限公司"]', value: '广州金港汽车国际贸易有限公司' },
    { selector: 'input[placeholder="914401153475269766"]:nth-of-type(1)', value: '914401153475269766' },
    { selector: 'input[placeholder="广州金港汽车国际贸易有限公司"]', value: '广州金港汽车国际贸易有限公司' },
    { selector: 'input[placeholder="914401153475269766"]:nth-of-type(2)', value: '914401153475269766' },
    { selector: 'input[placeholder="广州市南沙区龙穴街港荣一街3号405-4室"]', value: '广州市南沙区龙穴街港荣一街3号405-4室' },
    { selector: 'input[placeholder="020-39002350"]', value: '020-39002350' },
    { selector: 'input[placeholder="中国建设银行广州黄阁分理处"]', value: '中国建设银行广州黄阁分理处' },
    { selector: 'input[placeholder="44050139210100000070"]', value: '44050139210100000070' }
  ];
  
  // 填写乙方信息
  const supplierFields = [
    { selector: 'input[placeholder="广州舶源科技有限公司"]:nth-of-type(1)', value: '广州舶源科技有限公司' },
    { selector: 'input[placeholder="91440101MA9XYTH73D"]', value: '91440101MA9XYTH73D' },
    { selector: 'input[placeholder="广州舶源科技有限公司"]:nth-of-type(2)', value: '广州舶源科技有限公司' },
    { selector: 'input[placeholder="招商银行青岛分行市南支行"]', value: '招商银行青岛分行市南支行' },
    { selector: 'input[placeholder="532914066410788"]', value: '532914066410788' }
  ];

  // 填写货物信息
  const goodsFields = [
    { selector: 'input[type="number"]:nth-of-type(1)', value: '300000' }, // 指导价
    { selector: 'input[type="number"]:nth-of-type(2)', value: '280000' }, // 采购单价含税
  ];

  // 填写合同金额
  const amountFields = [
    { selector: 'input[type="number"]:nth-of-type(3)', value: '280000' }, // 合同总价数字
    { selector: 'input[placeholder="请输入中文大写金额"]', value: '贰拾捌万元整' }
  ];
  
  const allFields = [...buyerFields, ...supplierFields, ...goodsFields, ...amountFields];
  
  allFields.forEach(field => {
    const element = document.querySelector(field.selector);
    if (element && !element.value) {
      // 设置值
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(element, field.value);
      
      // 触发React事件
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  console.log('表单填写完成！');
}

// 运行填写函数
fillFormQuickly();
