# MCP 配置指南

## 概述

本项目配置了 MCP (Model Context Protocol) 服务器，扩展 Claude Code 的功能。

---

## 已配置的 MCP 服务器

| 服务器 | 功能 | 包名 |
|--------|------|------|
| **filesystem** | 文件系统操作 | `@anthropic/mcp-server-filesystem` |
| **git** | Git 仓库操作 | `@anthropic/mcp-server-git` |
| **brave-search** | 网络搜索 | `@anthropic/mcp-server-brave-search` |
| **sqlite** | SQLite 数据库 | `@anthropic/mcp-server-sqlite` |
| **fetch** | HTTP 请求 | `@anthropic/mcp-server-fetch` |
| **amap** | 高德地图服务 | `@modelcontextprotocol/server-amap` |

---

## 配置文件

配置文件位于项目根目录：`.mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-filesystem", "D:/my_project/auto-skills"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-git", "--repository", "D:/my_project/auto-skills"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-brave-search"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-sqlite", "--db-path", "D:/my_project/auto-skills/data/data.db"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-fetch"]
    },
    "amap": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-amap"],
      "env": {
        "AMAP_API_KEY": "你的高德地图API密钥"
      }
    }
  }
}
```

---

## 各服务器详解

### 1. filesystem - 文件系统操作

**功能**：读写项目文件

**使用场景**：
- 读取配置文件
- 创建新文件
- 列出目录内容

**配置路径**：`D:/my_project/auto-skills`

---

### 2. git - Git 仓库操作

**功能**：执行 Git 命令

**使用场景**：
- 查看提交历史
- 管理分支
- 查看文件差异

**配置仓库**：`D:/my_project/auto-skills`

---

### 3. brave-search - 网络搜索

**功能**：使用 Brave 搜索引擎搜索网络

**使用场景**：
- 搜索最新技术文档
- 查找解决方案
- 获取实时信息

**注意**：无需 API 密钥

---

### 4. sqlite - SQLite 数据库

**功能**：SQLite 数据库操作

**使用场景**：
- 数据持久化
- 缓存存储
- 结构化数据查询

**数据库路径**：`D:/my_project/auto-skills/data/data.db`

---

### 5. fetch - HTTP 请求

**功能**：发送 HTTP 请求

**使用场景**：
- 调用 REST API
- 获取网络资源
- 下载文件

---

### 6. amap - 高德地图

**功能**：地图、POI 搜索、路径规划

**使用场景**：
- 地点搜索
- 路径规划
- 地理编码

**需要 API 密钥**：见下方申请指南

---

## 高德地图 API 密钥申请

### 步骤

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册账号并登录
3. 进入控制台，创建应用
4. 添加 Key，选择「Web 服务」类型
5. 复制获取的 API Key

### 配置方法

在 `.mcp.json` 中将 `AMAP_API_KEY` 的值替换为你的密钥：

```json
"amap": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-amap"],
  "env": {
    "AMAP_API_KEY": "你的实际API密钥"
  }
}
```

### 安全提示

- `.mcp.json` 已添加到 `.gitignore`，不会被提交
- 不要将 API 密钥分享给他人
- 定期更换密钥以保证安全

---

## 使用方法

### 验证配置

1. 重启 Claude Code
2. 尝试使用 MCP 功能

### 示例

**文件系统操作**：
```
使用 filesystem MCP 读取 README.md
```

**Git 操作**：
```
使用 git MCP 查看最近提交
```

**网络搜索**：
```
使用 brave-search MCP 搜索 "Claude Code 技能开发"
```

**高德地图**：
```
使用 amap MCP 搜索附近的咖啡店
```

---

## 故障排除

### MCP 服务器未启动

**症状**：无法使用 MCP 功能

**解决方法**：
1. 检查 `.mcp.json` 语法是否正确
2. 确认 npx 已安装：`npx --version`
3. 查看错误日志

### 高德地图 API 失败

**症状**：地图相关功能报错

**解决方法**：
1. 确认 API 密钥已正确配置
2. 检查密钥是否已激活
3. 确认密钥类型为「Web 服务」

---

## 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [高德开放平台](https://lbs.amap.com/)
- [Anthropic MCP 服务器列表](https://github.com/modelcontextprotocol)
