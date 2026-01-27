import fs from 'fs/promises'
import path from 'path'
import { prisma } from './db'
import type { SkillMetadata } from '@/types'
import JSON5 from 'json5'

const SKILLS_ROOT_PATH = path.join(process.cwd(), '../skills')

export async function getAllSkillsFromFS(): Promise<SkillMetadata[]> {
  try {
    const pattern = path.join(SKILLS_ROOT_PATH, '**/skill.json')
    const skillFiles = await glob(pattern)
    const skills: SkillMetadata[] = []

    for (const filePath of skillFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const metadata = JSON5.parse(content)

        // 提取路径信息
        const relativePath = path.relative(SKILLS_ROOT_PATH, path.dirname(filePath))
        const category = path.dirname(relativePath)

        skills.push({
          ...metadata,
          path: relativePath,
          category,
        })
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error)
      }
    }

    return skills
  } catch (error) {
    console.error('Error scanning skills directory:', error)
    return []
  }
}

async function glob(pattern: string): Promise<string[]> {
  const results: string[] = []

  // 解析模式：获取基础目录和要匹配的文件名
  const normalizedPattern = pattern.replace(/\\/g, '/')
  const patternParts = normalizedPattern.split('/')

  // 找到 ** 的位置
  const doubleStarIndex = patternParts.indexOf('**')
  const targetFileName = patternParts[patternParts.length - 1]

  // 确定搜索根目录
  let searchRoot = process.cwd()
  if (doubleStarIndex > 0) {
    searchRoot = patternParts.slice(0, doubleStarIndex).join('/')
  }

  // 递归搜索函数
  async function searchDir(dir: string, depth: number) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // 递归搜索子目录
          await searchDir(fullPath, depth + 1)
        } else if (entry.name === targetFileName) {
          results.push(fullPath)
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
    }
  }

  await searchDir(searchRoot, 0)
  return results
}

export async function syncSkillsToDB() {
  const skillsFromFS = await getAllSkillsFromFS()

  for (const skillMeta of skillsFromFS) {
    await prisma.skill.upsert({
      where: { name: skillMeta.name },
      update: {
        displayName: skillMeta.displayName || skillMeta.name,
        description: skillMeta.description,
        version: skillMeta.version,
        path: skillMeta.path,
        category: skillMeta.category,
      },
      create: {
        name: skillMeta.name,
        displayName: skillMeta.displayName || skillMeta.name,
        description: skillMeta.description,
        version: skillMeta.version,
        path: skillMeta.path,
        category: skillMeta.category,
      },
    })
  }

  return skillsFromFS.length
}

export async function getSkillContent(skillName: string) {
  const skillPath = path.join(SKILLS_ROOT_PATH, skillName)

  try {
    const [skillJson, skillMd, descriptionMd] = await Promise.all([
      fs.readFile(path.join(skillPath, 'skill.json'), 'utf-8').catch(() => null),
      fs.readFile(path.join(skillPath, 'SKILL.md'), 'utf-8').catch(() => null),
      fs.readFile(path.join(skillPath, 'description.md'), 'utf-8').catch(() => null),
    ])

    return {
      skillJson: skillJson ? JSON5.parse(skillJson) : null,
      skillMd,
      descriptionMd,
    }
  } catch (error) {
    return null
  }
}

export async function getSkillCategories() {
  const categories = await prisma.skill.findMany({
    select: { category: true },
    distinct: ['category'],
    where: { enabled: true },
  })

  return categories.map(c => c.category)
}
