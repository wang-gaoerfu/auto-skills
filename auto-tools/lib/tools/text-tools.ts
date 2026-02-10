import type { ToolExecutor, ToolConfig, ToolResult } from '@/types/tool'

// 文本字数统计
const wordCountTool: ToolExecutor = {
  name: 'word-count',
  description: '统计文本的字数、字符数、行数、段落数等',
  category: 'text-processing',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: '输入文本',
        type: 'textarea',
        required: true,
        placeholder: '请输入要统计的文本',
      },
    ],
  },
  async execute(input: { text: string }): Promise<ToolResult> {
    const { text } = input

    // 统计各种指标
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const numbers = (text.match(/\d+/g) || []).length

    return {
      success: true,
      data: {
        chars,           // 总字符数
        charsNoSpaces,   // 不含空格字符数
        words,           // 单词数
        lines,           // 行数
        paragraphs,      // 段落数
        chineseChars,    // 中文字符数
        englishWords,    // 英文单词数
        numbers,         // 数字个数
      },
    }
  },
}

// 文本大小写转换
const caseConvertTool: ToolExecutor = {
  name: 'case-convert',
  description: '转换文本的大小写（大写、小写、首字母大写等）',
  category: 'text-processing',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: '输入文本',
        type: 'textarea',
        required: true,
        placeholder: '请输入要转换的文本',
      },
      {
        name: 'mode',
        label: '转换模式',
        type: 'select',
        required: true,
        defaultValue: 'upper',
        options: [
          { label: '全部大写', value: 'upper' },
          { label: '全部小写', value: 'lower' },
          { label: '首字母大写', value: 'capitalize' },
          { label: '每个单词首字母大写', value: 'title' },
          { label: '大小写互换', value: 'swap' },
        ],
      },
    ],
  },
  async execute(input: { text: string; mode: string }): Promise<ToolResult> {
    const { text, mode } = input
    let result = ''

    switch (mode) {
      case 'upper':
        result = text.toUpperCase()
        break
      case 'lower':
        result = text.toLowerCase()
        break
      case 'capitalize':
        result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
        break
      case 'title':
        result = text.replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
        break
      case 'swap':
        result = text.split('').map(c => {
          if (c >= 'a' && c <= 'z') return c.toUpperCase()
          if (c >= 'A' && c <= 'Z') return c.toLowerCase()
          return c
        }).join('')
        break
      default:
        result = text
    }

    return {
      success: true,
      data: { result },
    }
  },
}

// 文本去重
const textDeduplicateTool: ToolExecutor = {
  name: 'text-deduplicate',
  description: '去除文本中的重复行',
  category: 'text-processing',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: '输入文本',
        type: 'textarea',
        required: true,
        placeholder: '每行一个，将去除重复的行',
      },
      {
        name: 'caseSensitive',
        label: '区分大小写',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      {
        name: 'trimSpaces',
        label: '去除行首尾空格后比较',
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    ],
  },
  async execute(input: { text: string; caseSensitive?: boolean; trimSpaces?: boolean }): Promise<ToolResult> {
    const { text, caseSensitive = true, trimSpaces = false } = input

    const lines = text.split('\n')
    const seen = new Set<string>()
    const result: string[] = []

    for (let line of lines) {
      const key = trimSpaces ? line.trim() : line
      const compareKey = caseSensitive ? key : key.toLowerCase()

      if (!seen.has(compareKey)) {
        seen.add(compareKey)
        result.push(line)
      }
    }

    const originalCount = lines.length
    const resultCount = result.length
    const removedCount = originalCount - resultCount

    return {
      success: true,
      data: {
        result: result.join('\n'),
        originalCount,
        resultCount,
        removedCount,
      },
    }
  },
}

// 文本排序
const textSortTool: ToolExecutor = {
  name: 'text-sort',
  description: '对文本行进行排序',
  category: 'text-processing',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: '输入文本',
        type: 'textarea',
        required: true,
        placeholder: '每行一个，将按行排序',
      },
      {
        name: 'order',
        label: '排序方式',
        type: 'select',
        required: true,
        defaultValue: 'asc',
        options: [
          { label: '升序 (A-Z)', value: 'asc' },
          { label: '降序 (Z-A)', value: 'desc' },
          { label: '随机', value: 'random' },
        ],
      },
      {
        name: 'caseSensitive',
        label: '区分大小写',
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
    ],
  },
  async execute(input: { text: string; order: string; caseSensitive?: boolean }): Promise<ToolResult> {
    const { text, order, caseSensitive = false } = input

    let lines = text.split('\n')

    if (order === 'random') {
      // Fisher-Yates shuffle
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[lines[i], lines[j]] = [lines[j], lines[i]]
      }
    } else {
      lines.sort((a, b) => {
        const compareA = caseSensitive ? a : a.toLowerCase()
        const compareB = caseSensitive ? b : b.toLowerCase()
        return order === 'asc'
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA)
      })
    }

    return {
      success: true,
      data: {
        result: lines.join('\n'),
      },
    }
  },
}

// Markdown 转 HTML
const markdownToHtmlTool: ToolExecutor = {
  name: 'markdown-to-html',
  description: '将 Markdown 文本转换为 HTML',
  category: 'text-processing',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: 'Markdown 文本',
        type: 'textarea',
        required: true,
        placeholder: '请输入 Markdown 文本',
      },
    ],
  },
  async execute(input: { text: string }): Promise<ToolResult> {
    const { text } = input

    // 简单的 Markdown 转 HTML 实现
    let html = text

    // 标题
    html = html.replace(/^######\s(.+)$/gm, '<h6>$1</h6>')
    html = html.replace(/^#####\s(.+)$/gm, '<h5>$1</h5>')
    html = html.replace(/^####\s(.+)$/gm, '<h4>$1</h4>')
    html = html.replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^#\s(.+)$/gm, '<h1>$1</h1>')

    // 粗体和斜体
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
    html = html.replace(/_(.+?)_/g, '<em>$1</em>')

    // 删除线
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

    // 代码
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    html = html.replace(/`(.+?)`/g, '<code>$1</code>')

    // 链接
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')

    // 图片
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')

    // 无序列表
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>')
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>')

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

    // 段落
    html = html.replace(/\n\n/g, '</p><p>')
    html = '<p>' + html + '</p>'

    // 清理多余的 p 标签
    html = html.replace(/<p>(<h[1-6]>)/g, '$1')
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    html = html.replace(/<p>(<pre>)/g, '$1')
    html = html.replace(/(<\/pre>)<\/p>/g, '$1')
    html = html.replace(/<p>(<ul>)/g, '$1')
    html = html.replace(/(<\/ul>)<\/p>/g, '$1')
    html = html.replace(/<p>(<li>)/g, '$1')
    html = html.replace(/(<\/li>)<\/p>/g, '$1')

    return {
      success: true,
      data: { html },
    }
  },
}

// HTML 转 Markdown
const htmlToMarkdownTool: ToolExecutor = {
  name: 'html-to-markdown',
  description: '将 HTML 转换为 Markdown 文本',
  category: 'text-processing',
  isFree: true,
  config: {
    fields: [
      {
        name: 'html',
        label: 'HTML 代码',
        type: 'textarea',
        required: true,
        placeholder: '请输入 HTML 代码',
      },
    ],
  },
  async execute(input: { html: string }): Promise<ToolResult> {
    const { html } = input

    let markdown = html

    // 标题
    markdown = markdown.replace(/<h1[^>]*>(.+?)<\/h1>/gi, '# $1\n\n')
    markdown = markdown.replace(/<h2[^>]*>(.+?)<\/h2>/gi, '## $1\n\n')
    markdown = markdown.replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n\n')
    markdown = markdown.replace(/<h4[^>]*>(.+?)<\/h4>/gi, '#### $1\n\n')
    markdown = markdown.replace(/<h5[^>]*>(.+?)<\/h5>/gi, '##### $1\n\n')
    markdown = markdown.replace(/<h6[^>]*>(.+?)<\/h6>/gi, '###### $1\n\n')

    // 粗体和斜体
    markdown = markdown.replace(/<strong[^>]*>(.+?)<\/strong>/gi, '**$1**')
    markdown = markdown.replace(/<b[^>]*>(.+?)<\/b>/gi, '**$1**')
    markdown = markdown.replace(/<em[^>]*>(.+?)<\/em>/gi, '*$1*')
    markdown = markdown.replace(/<i[^>]*>(.+?)<\/i>/gi, '*$1*')

    // 删除线
    markdown = markdown.replace(/<del[^>]*>(.+?)<\/del>/gi, '~~$1~~')
    markdown = markdown.replace(/<s[^>]*>(.+?)<\/s>/gi, '~~$1~~')

    // 代码
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')
    markdown = markdown.replace(/<code[^>]*>(.+?)<\/code>/gi, '`$1`')

    // 链接
    markdown = markdown.replace(/<a[^>]*href="(.+?)"[^>]*>(.+?)<\/a>/gi, '[$2]($1)')

    // 图片
    markdown = markdown.replace(/<img[^>]*src="(.+?)"[^>]*alt="(.+?)"[^>]*>/gi, '![$2]($1)')
    markdown = markdown.replace(/<img[^>]*src="(.+?)"[^>]*>/gi, '![]($1)')

    // 列表
    markdown = markdown.replace(/<li[^>]*>(.+?)<\/li>/gi, '* $1')

    // 段落和换行
    markdown = markdown.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    markdown = markdown.replace(/<p[^>]*>(.+?)<\/p>/gi, '$1\n\n')
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n')

    // 清理剩余标签
    markdown = markdown.replace(/<[^>]+>/g, '')

    // 清理多余的空行
    markdown = markdown.replace(/\n{3,}/g, '\n\n')

    return {
      success: true,
      data: { markdown: markdown.trim() },
    }
  },
}

// Export all text processing tools
export const textTools: ToolExecutor[] = [
  wordCountTool,
  caseConvertTool,
  textDeduplicateTool,
  textSortTool,
  markdownToHtmlTool,
  htmlToMarkdownTool,
]

// Register all tools
export function registerTextTools() {
  textTools.forEach(tool => {
    // Use the tool name as the ID
    // The tools will be registered in the database separately
  })
}
