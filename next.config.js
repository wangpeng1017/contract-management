/** @type {import('next').NextConfig} */
const nextConfig = {
  // 服务器外部包配置
  serverExternalPackages: ['mammoth', 'turndown', 'markdown-it', 'pdf-parse', 'pdf2pic'],
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 处理 Node.js 模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // 处理 mammoth 等文档处理库
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('mammoth', 'turndown', 'markdown-it');
    }
    
    return config;
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 图片配置
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // API 路由配置已移至 app/api 路由处理器中
  
  // 输出配置（适用于 Vercel）
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 重定向配置
  async redirects() {
    return [
      // 可以在这里添加重定向规则
    ];
  },
  
  // 重写配置
  async rewrites() {
    return [
      // 可以在这里添加重写规则
    ];
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // TypeScript 配置
  typescript: {
    // 在构建时忽略 TypeScript 错误（不推荐，但可以用于紧急部署）
    // ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    // 在构建时忽略 ESLint 错误（不推荐，但可以用于紧急部署）
    // ignoreDuringBuilds: false,
  },
  
  // 静态文件配置
  trailingSlash: false,
  
  // 国际化配置（如果需要）
  // i18n: {
  //   locales: ['zh-CN', 'en'],
  //   defaultLocale: 'zh-CN',
  // },
};

module.exports = nextConfig;
