import fs from 'fs/promises'
import path from 'path'

const DOCS_PATH = path.join(process.cwd(), '../docs')

export interface Doc {
  slug: string
  title: string
  description?: string
  content?: string
}

export async function getAllDocs(): Promise<Doc[]> {
  try {
    const docsDir = await fs.readdir(DOCS_PATH, { withFileTypes: true })
    const docs: Doc[] = []

    for (const entry of docsDir) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace('.md', '')
        const filePath = path.join(DOCS_PATH, entry.name)
        const content = await fs.readFile(filePath, 'utf-8')

        const titleMatch = content.match(/^#\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : slug

        docs.push({
          slug,
          title,
          description: content.slice(0, 150).replace(/\n/g, ' '),
        })
      }
    }

    return docs.sort((a, b) => a.slug.localeCompare(b.slug))
  } catch (error) {
    console.error('Error reading docs directory:', error)
    return []
  }
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  try {
    const filePath = path.join(DOCS_PATH, `${slug}.md`)
    const content = await fs.readFile(filePath, 'utf-8')

    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : slug

    const descMatch = content.match(/^#.+?\n\n(.+?)\n/m)
    const description = descMatch ? descMatch[1] : undefined

    return {
      slug,
      title,
      description,
      content,
    }
  } catch (error) {
    console.error(`Error reading doc ${slug}:`, error)
    return null
  }
}
