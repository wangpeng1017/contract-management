import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库种子数据初始化...');

  // 创建默认合同分类
  const categories = [
    {
      name: '采购合同',
      description: '用于采购商品或服务的合同模板',
      color: '#10B981'
    },
    {
      name: '销售合同',
      description: '用于销售商品或服务的合同模板',
      color: '#3B82F6'
    },
    {
      name: '外贸合同',
      description: '用于进出口贸易的合同模板',
      color: '#8B5CF6'
    },
    {
      name: '上牌合同',
      description: '用于车辆上牌相关的合同模板',
      color: '#F59E0B'
    },
    {
      name: '服务合同',
      description: '用于提供各类服务的合同模板',
      color: '#EF4444'
    },
    {
      name: '其他合同',
      description: '其他类型的合同模板',
      color: '#6B7280'
    }
  ];

  for (const category of categories) {
    await prisma.contractCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  console.log('合同分类创建完成');
  console.log('数据库种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
