import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 创建默认管理员账户
  const hashedPassword = await bcrypt.hash('admin123456', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@auto-tools.com' },
    update: {},
    create: {
      email: 'admin@auto-tools.com',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  })
  console.log('创建管理员账户:', admin.email)

  // 给管理员开通会员
  await prisma.membership.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      plan: 'ENTERPRISE',
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  })
  console.log('管理员会员已激活')

  // 创建工具分类
  const categories = [
    { name: '文本处理', slug: 'text-processing', icon: '📝', description: '文本格式化、转换工具', sortOrder: 1 },
    { name: '数据转换', slug: 'data-conversion', icon: '🔄', description: '各种数据格式转换工具', sortOrder: 2 },
    { name: '开发工具', slug: 'dev-tools', icon: '👨‍💻', description: '开发者常用工具', sortOrder: 3 },
    { name: '图片处理', slug: 'image-processing', icon: '🖼️', description: '图片处理和转换工具', sortOrder: 4 },
    { name: '网络工具', slug: 'network-tools', icon: '🌐', description: '网络相关工具', sortOrder: 5 },
    { name: '加密解密', slug: 'crypto-tools', icon: '🔒', description: '加密、解密、哈希工具', sortOrder: 6 },
    { name: '编码解码', slug: 'encoding-tools', icon: '🔤', description: '各种编码解码工具', sortOrder: 7 },
    { name: '正则工具', slug: 'regex-tools', icon: '🔍', description: '正则表达式测试工具', sortOrder: 8 },
    { name: '时间日期', slug: 'datetime-tools', icon: '📅', description: '时间日期处理工具', sortOrder: 9 },
    { name: '其他工具', slug: 'other-tools', icon: '🔧', description: '其他实用工具', sortOrder: 10 },
  ]

  for (const category of categories) {
    await prisma.toolCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }
  console.log(`创建 ${categories.length} 个工具分类`)

  // 创建系统设置 - 会员套餐价格
  const settings = [
    {
      key: 'membership_prices',
      value: JSON.stringify({
        FREE: { price: 0, duration: 0, name: '免费版(FREE)' },
        BASIC: { price: 29, duration: 30, name: '基础版(BASIC)' },
        PRO: { price: 99, duration: 30, name: '专业版(PRO)' },
        ENTERPRISE: { price: 299, duration: 30, name: '企业版(ENTERPRISE)' },
      }),
    },
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('创建系统设置')

  // 获取分类ID
  const textCategory = await prisma.toolCategory.findUnique({ where: { slug: 'text-processing' } })
  const dataCategory = await prisma.toolCategory.findUnique({ where: { slug: 'data-conversion' } })
  const devCategory = await prisma.toolCategory.findUnique({ where: { slug: 'dev-tools' } })
  const networkCategory = await prisma.toolCategory.findUnique({ where: { slug: 'network-tools' } })

  if (!textCategory || !dataCategory || !devCategory || !networkCategory) {
    console.log('警告: 部分分类未找到，跳过工具创建')
  } else {
    // 创建文本处理工具
    const textTools = [
      { name: '字数统计', slug: 'word-count', description: '统计文本的字数、字符数、行数、段落数等', icon: '🔢', isFree: true, sortOrder: 1 },
      { name: '大小写转换', slug: 'case-convert', description: '转换文本的大小写（大写、小写、首字母大写等）', icon: '🔤', isFree: true, sortOrder: 2 },
      { name: '文本去重', slug: 'text-deduplicate', description: '去除文本中的重复行', icon: '🗑️', isFree: true, sortOrder: 3 },
      { name: '文本排序', slug: 'text-sort', description: '对文本行进行排序', icon: '📊', isFree: true, sortOrder: 4 },
      { name: 'Markdown转HTML', slug: 'markdown-to-html', description: '将 Markdown 文本转换为 HTML', icon: '📝', isFree: true, sortOrder: 5 },
      { name: 'HTML转Markdown', slug: 'html-to-markdown', description: '将 HTML 转换为 Markdown 文本', icon: '📄', isFree: true, sortOrder: 6 },
    ]

    for (const tool of textTools) {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: {},
        create: {
          ...tool,
          categoryId: textCategory.id,
        },
      })
    }
    console.log(`创建 ${textTools.length} 个文本处理工具`)

    // 创建数据转换工具
    const dataTools = [
      { name: 'JSON格式化', slug: 'json-format', description: '格式化或压缩 JSON 数据', icon: '📋', isFree: true, sortOrder: 1 },
      { name: 'XML转JSON', slug: 'xml-to-json', description: '将 XML 转换为 JSON', icon: '🔄', isFree: true, sortOrder: 2 },
      { name: 'Base64编解码', slug: 'base64', description: 'Base64 编码或解码', icon: '🔐', isFree: true, sortOrder: 3 },
      { name: 'URL编解码', slug: 'url-encode', description: 'URL 编码或解码', icon: '🔗', isFree: true, sortOrder: 4 },
      { name: '进制转换', slug: 'binary-hex-convert', description: '二进制、十六进制、十进制之间的转换', icon: '🔢', isFree: true, sortOrder: 5 },
    ]

    for (const tool of dataTools) {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: {},
        create: {
          ...tool,
          categoryId: dataCategory.id,
        },
      })
    }
    console.log(`创建 ${dataTools.length} 个数据转换工具`)

    // 创建开发工具
    const devTools = [
      { name: '颜色转换', slug: 'color-converter', description: '颜色格式转换 (HEX, RGB, HSL)', icon: '🎨', isFree: true, sortOrder: 1 },
      { name: 'Crontab解析', slug: 'crontab-parser', description: '解析 Crontab 表达式并显示执行时间', icon: '⏰', isFree: true, sortOrder: 2 },
    ]

    for (const tool of devTools) {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: {},
        create: {
          ...tool,
          categoryId: devCategory.id,
        },
      })
    }
    console.log(`创建 ${devTools.length} 个开发工具`)
  }

  // 创建网络工具
  if (networkCategory) {
    const networkTools = [
      { name: '抖音视频下载', slug: 'douyin-video-downloader', description: '根据抖音视频链接下载无水印视频', icon: '📱', isFree: true, sortOrder: 1 },
    ]

    for (const tool of networkTools) {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: {},
        create: {
          ...tool,
          categoryId: networkCategory.id,
        },
      })
    }
    console.log(`创建 ${networkTools.length} 个网络工具`)
  }

  console.log('数据库初始化完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
