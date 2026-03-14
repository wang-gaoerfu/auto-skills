import { ChromaClient, Collection, IncludeEnum } from "chromadb"
import path from "path"

// ChromaDB 配置
const CHROMA_URL = process.env.CHROMA_URL || ""
const CHROMA_DB_PATH = process.env.CHROMA_DB_PATH || path.join(process.cwd(), "data", "chroma")

// 使用持久化客户端（本地文件模式）或远程服务器模式
const usePersistentClient = !process.env.CHROMA_URL

let client: ChromaClient | null = null

// 获取 ChromaDB 客户端
export async function getChromaClient(): Promise<ChromaClient> {
  if (client) return client

  try {
    if (usePersistentClient) {
      // 本地持久化模式 - 使用新的配置格式
      const { ChromaClient } = await import("chromadb")
      client = new ChromaClient({
        host: "localhost",
        port: 8000,
        ssl: false,
      })
      console.log("[ChromaDB] Using local persistent client at:", CHROMA_DB_PATH)
    } else {
      // 远程服务器模式
      const { ChromaClient } = await import("chromadb")
      const url = new URL(CHROMA_URL)
      client = new ChromaClient({
        host: url.hostname,
        port: parseInt(url.port) || 8000,
        ssl: url.protocol === "https:",
      })
      console.log("[ChromaDB] Using remote client at:", CHROMA_URL)
    }

    return client
  } catch (error) {
    console.error("[ChromaDB] Failed to create client:", error)
    throw error
  }
}

// 集合名称前缀
const COLLECTION_PREFIX = "novel_knowledge"

// 获取项目集合名称
function getCollectionName(projectId: string): string {
  return `${COLLECTION_PREFIX}_${projectId}`
}

// 获取或创建集合
export async function getCollection(projectId: string): Promise<Collection> {
  const chromaClient = await getChromaClient()
  const collectionName = getCollectionName(projectId)

  try {
    // 尝试获取已存在的集合
    const collection = await chromaClient.getCollection({ name: collectionName })
    return collection
  } catch {
    // 集合不存在，创建新集合
    const collection = await chromaClient.createCollection({
      name: collectionName,
      metadata: {
        description: `Knowledge base for project ${projectId}`,
        projectId: projectId,
      },
    })
    return collection
  }
}

// 删除集合
export async function deleteCollection(projectId: string): Promise<void> {
  const chromaClient = await getChromaClient()
  const collectionName = getCollectionName(projectId)

  try {
    await chromaClient.deleteCollection({ name: collectionName })
  } catch {
    // 集合不存在，忽略
  }
}

// 知识条目类型
export interface KnowledgeVector {
  id: string
  entryId: string
  entryType: "character" | "world" | "plot" | "scene" | "dialogue"
  title: string
  content: string
  metadata?: Record<string, any>
}

// 简单的文本转向量函数（使用文本特征的哈希）
// 生产环境建议使用 OpenAI embeddings 或本地模型
function textToVector(text: string): number[] {
  const vector: number[] = []
  const dimension = 384 // 标准嵌入维度

  // 使用简单的字符频率作为特征
  const charFreq: Record<string, number> = {}
  for (const char of text.toLowerCase()) {
    charFreq[char] = (charFreq[char] || 0) + 1
  }

  // 生成固定维度的向量
  for (let i = 0; i < dimension; i++) {
    const charCode = i % 128
    const char = String.fromCharCode(charCode)
    vector.push((charFreq[char] || 0) / Math.max(text.length, 1))
  }

  // 归一化
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  return norm > 0 ? vector.map(v => v / norm) : vector
}

// 添加知识条目到向量库
export async function addKnowledgeToVector(
  projectId: string,
  entry: KnowledgeVector
): Promise<void> {
  const collection = await getCollection(projectId)

  // 构建用于向量化的文本
  const textForEmbedding = `${entry.title}\n${entry.content}\n类型: ${entry.entryType}`

  // 添加到集合
  await collection.add({
    ids: [entry.id],
    embeddings: [textToVector(textForEmbedding)],
    metadatas: [{
      entryId: entry.entryId,
      entryType: entry.entryType,
      title: entry.title,
      projectId: projectId,
      ...entry.metadata,
    }],
    documents: [textForEmbedding],
  })
}

// 批量添加知识条目
export async function addKnowledgeBatch(
  projectId: string,
  entries: KnowledgeVector[]
): Promise<void> {
  if (entries.length === 0) return

  const collection = await getCollection(projectId)

  const ids: string[] = []
  const embeddings: number[][] = []
  const metadatas: Record<string, any>[] = []
  const documents: string[] = []

  for (const entry of entries) {
    const textForEmbedding = `${entry.title}\n${entry.content}\n类型: ${entry.entryType}`

    ids.push(entry.id)
    embeddings.push(textToVector(textForEmbedding))
    metadatas.push({
      entryId: entry.entryId,
      entryType: entry.entryType,
      title: entry.title,
      projectId: projectId,
      ...entry.metadata,
    })
    documents.push(textForEmbedding)
  }

  await collection.add({
    ids,
    embeddings,
    metadatas,
    documents,
  })
}

// 更新知识条目
export async function updateKnowledgeVector(
  projectId: string,
  entry: KnowledgeVector
): Promise<void> {
  const collection = await getCollection(projectId)

  // 先删除旧的
  try {
    await collection.delete({ ids: [entry.id] })
  } catch {
    // 忽略删除错误
  }

  // 添加新的
  await addKnowledgeToVector(projectId, entry)
}

// 删除知识条目
export async function deleteKnowledgeVector(
  projectId: string,
  vectorId: string
): Promise<void> {
  const collection = await getCollection(projectId)

  try {
    await collection.delete({ ids: [vectorId] })
  } catch {
    // 忽略删除错误
  }
}

// 检索相关知识的参数
export interface RetrieveOptions {
  projectId: string
  query: string
  entryTypes?: ("character" | "world" | "plot" | "scene" | "dialogue")[]
  topK?: number
}

// 检索结果
export interface RetrieveResult {
  entryId: string
  entryType: string
  title: string
  content: string
  score: number
  metadata: Record<string, any>
}

// 检索相关知识
export async function retrieveRelevantKnowledge(
  options: RetrieveOptions
): Promise<RetrieveResult[]> {
  const { projectId, query, entryTypes, topK = 5 } = options

  try {
    const collection = await getCollection(projectId)

    // 构建查询过滤器
    const where: Record<string, any> = {}
    if (entryTypes && entryTypes.length > 0) {
      if (entryTypes.length === 1) {
        where.entryType = entryTypes[0]
      } else {
        where.entryType = { $in: entryTypes }
      }
    }

    // 查询最相关的条目
    const results = await collection.query({
      queryEmbeddings: [textToVector(query)],
      nResults: topK,
      where: Object.keys(where).length > 0 ? where : undefined,
      include: [IncludeEnum.documents, IncludeEnum.metadatas, IncludeEnum.distances],
    })

    if (!results.ids || results.ids.length === 0 || results.ids[0].length === 0) {
      return []
    }

    // 格式化结果
    const retrieveResults: RetrieveResult[] = []
    for (let i = 0; i < results.ids[0].length; i++) {
      const metadata = results.metadatas?.[0]?.[i] || {}
      const document = results.documents?.[0]?.[i] || ""
      const distance = results.distances?.[0]?.[i] || 0

      // 将距离转换为相似度分数（距离越小，相似度越高）
      const score = 1 - (typeof distance === 'number' ? distance : 0)

      retrieveResults.push({
        entryId: String(metadata.entryId || ""),
        entryType: String(metadata.entryType || ""),
        title: String(metadata.title || ""),
        content: document,
        score,
        metadata,
      })
    }

    return retrieveResults
  } catch (error) {
    console.error("Failed to retrieve from vector store:", error)
    return []
  }
}

// 获取 AI 生成时的上下文
export async function getAIContext(
  projectId: string,
  currentContent: string,
  options?: {
    includeCharacters?: boolean
    includeWorld?: boolean
    includePlot?: boolean
    topK?: number
  }
): Promise<{
  characters: string
  world: string
  plot: string
}> {
  const {
    includeCharacters = true,
    includeWorld = true,
    includePlot = true,
    topK = 3,
  } = options || {}

  const result = {
    characters: "",
    world: "",
    plot: "",
  }

  try {
    // 检索人物设定
    if (includeCharacters) {
      const characterResults = await retrieveRelevantKnowledge({
        projectId,
        query: currentContent,
        entryTypes: ["character"],
        topK,
      })
      if (characterResults.length > 0) {
        result.characters = characterResults
          .map((r) => `【${r.title}】\n${r.content}`)
          .join("\n\n")
      }
    }

    // 检索世界观设定
    if (includeWorld) {
      const worldResults = await retrieveRelevantKnowledge({
        projectId,
        query: currentContent,
        entryTypes: ["world"],
        topK: 2,
      })
      if (worldResults.length > 0) {
        result.world = worldResults
          .map((r) => `【${r.title}】\n${r.content}`)
          .join("\n\n")
      }
    }

    // 检索剧情设定
    if (includePlot) {
      const plotResults = await retrieveRelevantKnowledge({
        projectId,
        query: currentContent,
        entryTypes: ["plot"],
        topK: 2,
      })
      if (plotResults.length > 0) {
        result.plot = plotResults
          .map((r) => `【${r.title}】\n${r.content}`)
          .join("\n\n")
      }
    }

    return result
  } catch (error) {
    console.error("Failed to get AI context:", error)
    return result
  }
}

// 检查向量数据库是否可用
export async function isVectorDBAvailable(): Promise<boolean> {
  try {
    const chromaClient = await getChromaClient()
    await chromaClient.heartbeat()
    return true
  } catch (error) {
    // 仅在调试模式下输出详细错误
    if (process.env.DEBUG_CHROMA === "true") {
      console.error("Vector DB not available:", error)
    } else {
      console.log("[ChromaDB] Vector DB not available, using database fallback")
    }
    return false
  }
}
