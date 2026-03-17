/**
 * 创建超级管理员种子脚本
 *
 * 运行方式: npx ts-node prisma/seed-super-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@localhost'
  const password = 'admin123456' // 默认密码， 生产环境请修改
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // 检查是否已存在
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      // 更新为超级管理员
      await prisma.user.update({
        where: { email },
        data: { role: 'SUPER_ADMIN' }
      })
      console.log(`用户 ${email} 已更新为超级管理员`)
    } else {
      // 创建新的超级管理员
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: '超级管理员',
          role: 'SUPER_ADMIN',
          isActive: true,
        }
      })
      console.log(`超级管理员创建成功!`)
      console.log(`邮箱: ${email}`)
      console.log(`密码: ${password}`)
      console.log(`请登录后立即修改密码!`)
    }
  } catch (error) {
    console.error('创建超级管理员失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
