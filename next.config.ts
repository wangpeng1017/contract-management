import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 优化Vercel部署
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // 确保Prisma在构建时正确处理
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },

  // 环境变量配置
  env: {
    PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY || 'true',
  },

  // 输出配置
  output: 'standalone',

  // 图片优化配置
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
};

export default nextConfig;
