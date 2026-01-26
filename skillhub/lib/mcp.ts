import fs from 'fs/promises'
import path from 'path'

const CLAUDE_CONFIG_PATH = path.join(process.cwd(), '../.claude/config.json')

export interface MCPServerConfig {
  [key: string]: {
    command: string
    args?: string[]
    env?: Record<string, string>
  }
}

export async function getMCPConfig(): Promise<MCPServerConfig> {
  try {
    const content = await fs.readFile(CLAUDE_CONFIG_PATH, 'utf-8')
    const config = JSON.parse(content)
    return config.mcpServers || {}
  } catch (error) {
    // 如果文件不存在或读取失败，返回空配置
    return {}
  }
}

export async function updateMCPConfig(config: MCPServerConfig): Promise<void> {
  try {
    // 读取现有配置
    let fullConfig: any = {}
    try {
      const content = await fs.readFile(CLAUDE_CONFIG_PATH, 'utf-8')
      fullConfig = JSON.parse(content)
    } catch {
      // 文件不存在，创建新配置
    }

    // 更新 mcpServers 部分
    fullConfig.mcpServers = config

    // 确保目录存在
    await fs.mkdir(path.dirname(CLAUDE_CONFIG_PATH), { recursive: true })

    // 写入文件
    await fs.writeFile(CLAUDE_CONFIG_PATH, JSON.stringify(fullConfig, null, 2), 'utf-8')
  } catch (error) {
    throw new Error('Failed to update MCP config')
  }
}

export async function addMCPServer(name: string, serverConfig: any): Promise<void> {
  const config = await getMCPConfig()
  config[name] = serverConfig
  await updateMCPConfig(config)
}

export async function removeMCPServer(name: string): Promise<void> {
  const config = await getMCPConfig()
  delete config[name]
  await updateMCPConfig(config)
}

export async function syncMCPServersToDB() {
  const { prisma } = await import('./db')
  const config = await getMCPConfig()

  for (const [name, serverConfig] of Object.entries(config)) {
    await prisma.mCPServer.upsert({
      where: { name },
      update: {
        type: serverConfig.command,
        config: JSON.stringify(serverConfig),
        enabled: true,
      },
      create: {
        name,
        type: serverConfig.command,
        config: JSON.stringify(serverConfig),
        enabled: true,
      },
    })
  }

  return Object.keys(config).length
}
