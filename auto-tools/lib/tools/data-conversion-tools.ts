import type { ToolExecutor, ToolResult } from '@/types/tool'

// JSON 格式化/压缩
const jsonFormatTool: ToolExecutor = {
  name: 'json-format',
  description: '格式化或压缩 JSON 数据',
  category: 'data-conversion',
  isFree: true,
  config: {
    fields: [
      {
        name: 'json',
        label: 'JSON 数据',
        type: 'textarea',
        required: true,
        placeholder: '请输入 JSON 数据',
      },
      {
        name: 'action',
        label: '操作',
        type: 'select',
        required: true,
        defaultValue: 'format',
        options: [
          { label: '格式化', value: 'format' },
          { label: '压缩', value: 'minify' },
        ],
      },
      {
        name: 'spaces',
        label: '缩进空格数',
        type: 'number',
        required: false,
        defaultValue: 2,
        min: 0,
        max: 8,
      },
    ],
  },
  async execute(input: { json: string; action: string; spaces?: number }): Promise<ToolResult> {
    const { json, action, spaces = 2 } = input

    try {
      const parsed = JSON.parse(json)

      let result: string
      if (action === 'format') {
        result = JSON.stringify(parsed, null, spaces)
      } else {
        result = JSON.stringify(parsed)
      }

      return {
        success: true,
        data: { result },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '无效的 JSON 格式',
      }
    }
  },
}

// XML 转 JSON
const xmlToJsonTool: ToolExecutor = {
  name: 'xml-to-json',
  description: '将 XML 转换为 JSON',
  category: 'data-conversion',
  isFree: true,
  config: {
    fields: [
      {
        name: 'xml',
        label: 'XML 数据',
        type: 'textarea',
        required: true,
        placeholder: '请输入 XML 数据',
      },
    ],
  },
  async execute(input: { xml: string }): Promise<ToolResult> {
    const { xml } = input

    try {
      // Simple XML to JSON parser
      const parseNode = (node: Element): any => {
        const obj: any = {}

        // Attributes
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i]
          obj[`@${attr.name}`] = attr.value
        }

        // Child elements and text content
        const children = Array.from(node.children)
        if (children.length === 0) {
          if (node.textContent) {
            return node.textContent
          }
          return obj
        }

        for (const child of children) {
          const childObj = parseNode(child as Element)
          if (obj[child.tagName]) {
            if (!Array.isArray(obj[child.tagName])) {
              obj[child.tagName] = [obj[child.tagName]]
            }
            obj[child.tagName].push(childObj)
          } else {
            obj[child.tagName] = childObj
          }
        }

        return obj
      }

      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')

      const errorNode = doc.querySelector('parsererror')
      if (errorNode) {
        return {
          success: false,
          error: '无效的 XML 格式',
        }
      }

      const root = doc.documentElement
      const result = { [root.tagName]: parseNode(root) }

      return {
        success: true,
        data: { result: JSON.stringify(result, null, 2) },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'XML 解析失败',
      }
    }
  },
}

// CSV 转 JSON
const csvToJsonTool: ToolExecutor = {
  name: 'csv-to-json',
  description: '将 CSV 转换为 JSON 数组',
  category: 'data-conversion',
  isFree: true,
  config: {
    fields: [
      {
        name: 'csv',
        label: 'CSV 数据',
        type: 'textarea',
        required: true,
        placeholder: '请输入 CSV 数据（第一行为表头）',
      },
      {
        name: 'delimiter',
        label: '分隔符',
        type: 'select',
        required: true,
        defaultValue: ',',
        options: [
          { label: '逗号 (,)', value: ',' },
          { label: '分号 (;)', value: ';' },
          { label: '制表符 (\\t)', value: '\t' },
          { label: '竖线 (|)', value: '|' },
        ],
      },
    ],
  },
  async execute(input: { csv: string; delimiter: string }): Promise<ToolResult> {
    const { csv, delimiter } = input

    try {
      const lines = csv.trim().split('\n')
      if (lines.length < 2) {
        return {
          success: false,
          error: 'CSV 至少需要包含表头和一行数据',
        }
      }

      // Parse header
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))

      // Parse data rows
      const result = lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] || ''
        })
        return obj
      })

      return {
        success: true,
        data: {
          result: JSON.stringify(result, null, 2),
          rowCount: result.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSV 解析失败',
      }
    }
  },
}

// Base64 编码/解码
const base64Tool: ToolExecutor = {
  name: 'base64',
  description: 'Base64 编码或解码',
  category: 'data-conversion',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: '输入文本',
        type: 'textarea',
        required: true,
        placeholder: '请输入要编码/解码的文本',
      },
      {
        name: 'action',
        label: '操作',
        type: 'select',
        required: true,
        defaultValue: 'encode',
        options: [
          { label: '编码', value: 'encode' },
          { label: '解码', value: 'decode' },
        ],
      },
    ],
  },
  async execute(input: { text: string; action: string }): Promise<ToolResult> {
    const { text, action } = input

    try {
      let result: string

      if (action === 'encode') {
        // Handle Unicode characters
        const encoded = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => {
          return String.fromCharCode(parseInt(p1, 16))
        })
        result = btoa(encoded)
      } else {
        // Decode
        const decoded = atob(text)
        result = decodeURIComponent(decoded.split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
      }

      return {
        success: true,
        data: { result },
      }
    } catch (error) {
      return {
        success: false,
        error: action === 'encode' ? '编码失败' : '无效的 Base64 字符串',
      }
    }
  },
}

// URL 编码/解码
const urlEncodeTool: ToolExecutor = {
  name: 'url-encode',
  description: 'URL 编码或解码',
  category: 'data-conversion',
  isFree: true,
  config: {
    fields: [
      {
        name: 'text',
        label: '输入文本',
        type: 'textarea',
        required: true,
        placeholder: '请输入要编码/解码的文本',
      },
      {
        name: 'action',
        label: '操作',
        type: 'select',
        required: true,
        defaultValue: 'encode',
        options: [
          { label: '编码', value: 'encode' },
          { label: '解码', value: 'decode' },
        ],
      },
    ],
  },
  async execute(input: { text: string; action: string }): Promise<ToolResult> {
    const { text, action } = input

    try {
      const result = action === 'encode'
        ? encodeURIComponent(text)
        : decodeURIComponent(text)

      return {
        success: true,
        data: { result },
      }
    } catch (error) {
      return {
        success: false,
        error: action === 'encode' ? '编码失败' : '无效的 URL 编码字符串',
      }
    }
  },
}

// 二进制/十六进制转换
const binaryHexTool: ToolExecutor = {
  name: 'binary-hex-convert',
  description: '二进制、十六进制、十进制之间的转换',
  category: 'data-conversion',
  isFree: true,
  config: {
    fields: [
      {
        name: 'input',
        label: '输入数值',
        type: 'text',
        required: true,
        placeholder: '请输入数值',
      },
      {
        name: 'from',
        label: '输入格式',
        type: 'select',
        required: true,
        defaultValue: 'dec',
        options: [
          { label: '十进制', value: 'dec' },
          { label: '十六进制', value: 'hex' },
          { label: '二进制', value: 'bin' },
        ],
      },
      {
        name: 'to',
        label: '输出格式',
        type: 'select',
        required: true,
        defaultValue: 'hex',
        options: [
          { label: '十进制', value: 'dec' },
          { label: '十六进制', value: 'hex' },
          { label: '二进制', value: 'bin' },
        ],
      },
    ],
  },
  async execute(input: { input: string; from: string; to: string }): Promise<ToolResult> {
    const { input: value, from, to } = input

    try {
      // Convert to decimal first
      let decimal: number
      switch (from) {
        case 'hex':
          decimal = parseInt(value, 16)
          break
        case 'bin':
          decimal = parseInt(value, 2)
          break
        default:
          decimal = parseInt(value, 10)
      }

      if (isNaN(decimal)) {
        return {
          success: false,
          error: '无效的输入数值',
        }
      }

      // Convert from decimal to target format
      let result: string
      switch (to) {
        case 'hex':
          result = decimal.toString(16).toUpperCase()
          break
        case 'bin':
          result = decimal.toString(2)
          break
        default:
          result = decimal.toString(10)
      }

      return {
        success: true,
        data: {
          result,
          decimal,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: '转换失败',
      }
    }
  },
}

// Export all data conversion tools
export const dataConversionTools: ToolExecutor[] = [
  jsonFormatTool,
  xmlToJsonTool,
  csvToJsonTool,
  base64Tool,
  urlEncodeTool,
  binaryHexTool,
]
