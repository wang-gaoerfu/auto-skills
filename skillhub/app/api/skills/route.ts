import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { syncSkillsToDB, getSkillContent } from '@/lib/skills'
import fs from 'fs/promises'
import path from 'path'

// GET /api/skills - 获取所有技能
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sync = searchParams.get('sync')

    // 如果需要同步
    if (sync === 'true') {
      await syncSkillsToDB()
    }

    const where = category ? { category, enabled: true } : { enabled: true }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

// POST /api/skills - 同步技能或创建新技能
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 如果有 data 字段，表示创建新技能
    if (body.data) {
      const skillData = body.data
      const skillsPath = path.join(process.cwd(), '../skills')
      const skillDir = path.join(skillsPath, skillData.category, skillData.name)

      // 检查是否已存在
      try {
        await fs.access(skillDir)
        return NextResponse.json(
          { error: '技能已存在' },
          { status: 400 }
        )
      } catch {
        // 目录不存在，可以创建
      }

      // 创建目录
      await fs.mkdir(skillDir, { recursive: true })

      // 复制模板文件
      const templateDir = path.join(skillsPath, 'templates', 'basic-skill')
      const templateFiles = await fs.readdir(templateDir)

      for (const file of templateFiles) {
        const content = await fs.readFile(path.join(templateDir, file), 'utf-8')

        let newContent = content
        if (file === 'skill.json') {
          // 替换模板中的占位符
          const template = JSON.parse(content)
          template.name = skillData.name
          template.displayName = skillData.displayName
          template.description = skillData.description
          template.version = skillData.version
          template.author = skillData.author || 'Auto-Skills Team'
          newContent = JSON.stringify(template, null, 2)
        } else if (file === 'SKILL.md' || file === 'description.md') {
          // 替换标题中的占位符
          newContent = content
            .replace(/\[技能名称\]/g, skillData.displayName)
            .replace(/\[skill-name\]/g, skillData.name)
            .replace(/\[My First Skill\]/g, skillData.displayName)
            .replace(/\[my-skill\]/g, skillData.name)
        }

        await fs.writeFile(path.join(skillDir, file), newContent)
      }

      // 同步到数据库
      await syncSkillsToDB()

      return NextResponse.json({
        message: '技能创建成功',
        skill: { name: skillData.name, path: `${skillData.category}/${skillData.name}` },
      })
    }

    // 否则是同步操作
    const count = await syncSkillsToDB()

    return NextResponse.json({
      message: 'Skills synced successfully',
      count,
    })
  } catch (error) {
    console.error('Error in POST /api/skills:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
