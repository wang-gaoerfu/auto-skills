import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSkillContent } from '@/lib/skills'
import fs from 'fs/promises'
import path from 'path'

// GET /api/skills/[name] - 获取技能详情
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const skill = await prisma.skill.findUnique({
      where: { name: params.name },
      include: {
        tags: {
          include: { tag: true },
        },
        favorites: true,
      },
    })

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // 获取技能内容
    const content = await getSkillContent(skill.name)

    return NextResponse.json({ skill, content })
  } catch (error) {
    console.error('Error fetching skill:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skill' },
      { status: 500 }
    )
  }
}

// PATCH /api/skills/[name] - 更新技能或编辑文件
export async function PATCH(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const body = await request.json()

    // 如果包含 file 和 content，表示编辑文件
    if (body.file && body.content !== undefined) {
      const skill = await prisma.skill.findUnique({
        where: { name: params.name },
      })

      if (!skill) {
        return NextResponse.json(
          { error: 'Skill not found' },
          { status: 404 }
        )
      }

      const skillsPath = path.join(process.cwd(), '../skills')
      const filePath = path.join(skillsPath, skill.path, body.file)

      // 写入文件
      await fs.writeFile(filePath, body.content, 'utf-8')

      // 如果编辑的是 skill.json，更新数据库
      if (body.file === 'skill.json') {
        try {
          const skillJson = JSON.parse(body.content)
          await prisma.skill.update({
            where: { name: params.name },
            data: {
              displayName: skillJson.displayName || skillJson.name,
              description: skillJson.description,
              version: skillJson.version,
              updatedAt: new Date(),
            },
          })
        } catch (error) {
          // JSON 解析失败，忽略
        }
      }

      return NextResponse.json({ success: true })
    }

    // 否则是更新数据库
    const skill = await prisma.skill.update({
      where: { name: params.name },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Error updating skill:', error)
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    )
  }
}

// DELETE /api/skills/[name] - 删除技能（软删除）
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const skill = await prisma.skill.update({
      where: { name: params.name },
      data: { enabled: false },
    })

    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Error deleting skill:', error)
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    )
  }
}
