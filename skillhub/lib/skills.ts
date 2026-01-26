import fs from 'fs/promises'
import path from 'path'
import { prisma } from './db'
import type { SkillMetadata } from '@/types'

const SKILLS_ROOT_PATH = path.join(process.cwd(), '../skills')

export async function getAllSkillsFromFS(): Promise<SkillMetadata[]> {
  try {
    const skillFiles = await glob(path.join(SKILLS_ROOT_PATH, '**/skill.json'))
    const skills: SkillMetadata[] = []

    for (const filePath of skillFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const metadata = JSON.parse(content)

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
  const results: string[] = const dir = path.dirname(pattern)
  const base = path.basename(pattern)

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await glob(path.join(fullPath, base)).then(files => results.push(...files))
      } else if (entry.name === path.basename(pattern)) {
        results.push(fullPath)
      }
    }
  } catch (error) {
    // Ignore errors for non-existent directories
  }

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
      skillJson: skillJson ? JSON.parse(skillJson) : null,
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
